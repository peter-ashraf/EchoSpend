import { useState, useRef, useCallback, useEffect } from 'react';
import { Microphone, StopCircle, Sparkle, Keyboard, WifiSlash, CloudArrowDown, CheckCircle, Warning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { startRecording } from '../../lib/whisperOffline';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  onParsingStart?: () => void;
  /** Called when the keyboard fallback should open. offline=true when triggered by offline detection. */
  onRequestKeyboard?: (offline?: boolean) => void;
  /** Called when first offline mic tap needs to show the consent modal */
  onRequestOfflineConsent?: () => void;
  /** Called with the recorded audio blob for Whisper transcription */
  onOfflineAudioReady?: (blob: Blob) => void;
  /** Current offline voice package status from settings */
  offlineVoiceStatus?: 'not-asked' | 'declined' | 'ready';
  /** True while Whisper is transcribing the audio */
  isWhisperTranscribing?: boolean;
}

export function VoiceMicButton({
  onTranscript,
  onParsingStart,
  onRequestKeyboard,
  onRequestOfflineConsent,
  onOfflineAudioReady,
  offlineVoiceStatus,
  isWhisperTranscribing,
}: VoiceMicButtonProps) {
  const { settings, updateSettings } = useStore();
  const voiceLang = settings?.voiceLanguage || 'ar-EG';

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPreview, setSuccessPreview] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // For offline recording via MediaRecorder
  const offlineRecorderRef = useRef<{ stop: () => void } | null>(null);
  const [isOfflineRecording, setIsOfflineRecording] = useState(false);

  // Session ID pattern: prevents stale callbacks from old recognition sessions
  const sessionIdRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedTranscriptRef = useRef<string>('');

  // ── Online / Offline detection ──────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync processing state with parent's Whisper transcribing state
  useEffect(() => {
    if (isWhisperTranscribing) {
      setIsProcessing(true);
    } else {
      setIsProcessing(false);
    }
  }, [isWhisperTranscribing]);

  // ── Cleanup a Web Speech API session safely ────────────────
  const stopAndCleanupRecognition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch (_) {
        try { rec.abort(); } catch (_) { /* ignore */ }
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── Handle captured transcript ───────────────────────────────
  const handleCapturedText = useCallback((text: string) => {
    if (!text || text.trim().length === 0) {
      setErrorMessage(voiceLang === 'ar-EG' ? 'لم يتم التقاط صوت — حاول مرة أخرى' : 'No voice detected. Please try again.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    
    // Trigger Visual Success Feedback
    setErrorMessage(null);
    setSuccessPreview(text.trim());
    setIsProcessing(true);
    if (onParsingStart) onParsingStart();
    onTranscript(text.trim());

    setTimeout(() => {
      setIsProcessing(false);
    }, 450);

    setTimeout(() => {
      setSuccessPreview(null);
    }, 3500);
  }, [onParsingStart, onTranscript, voiceLang]);

  // ── Offline recording (MediaRecorder → Whisper) ──────────────
  const startOfflineRecording = useCallback(() => {
    setErrorMessage(null);
    setSuccessPreview(null);
    setIsOfflineRecording(true);
    setIsListening(true);
    const recorder = startRecording({
      onStop: (blob) => {
        setIsOfflineRecording(false);
        setIsListening(false);
        setIsProcessing(true);
        onOfflineAudioReady?.(blob);
      },
      onError: (msg) => {
        setIsOfflineRecording(false);
        setIsListening(false);
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 3500);
      },
    });
    offlineRecorderRef.current = recorder;

    // Auto-stop after 15 seconds
    timeoutRef.current = setTimeout(() => {
      offlineRecorderRef.current?.stop();
    }, 15000);
  }, [onOfflineAudioReady]);

  const stopOfflineRecording = useCallback(() => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    offlineRecorderRef.current?.stop();
    offlineRecorderRef.current = null;
    setIsListening(false);
    setIsProcessing(true);
  }, []);

  // ── Online: Web Speech API ───────────────────────────────────
  const startListening = useCallback(() => {
    setErrorMessage(null);
    setSuccessPreview(null);

    // ── Offline path ──────────────────────────────────────────
    if (!navigator.onLine) {
      if (offlineVoiceStatus === 'ready') {
        startOfflineRecording();
      } else if (offlineVoiceStatus === 'not-asked') {
        onRequestOfflineConsent?.();
      } else {
        onRequestKeyboard?.(true);
      }
      return;
    }

    // ── Online: Web Speech API ─────────────────────────────────
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { onRequestKeyboard?.(false); return; }

    stopAndCleanupRecognition();
    const currentSessionId = ++sessionIdRef.current;
    capturedTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (event.results?.[0]?.[0]?.transcript) {
          capturedTranscriptRef.current = event.results[0][0].transcript;
        }
      };

      recognition.onerror = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (event.error !== 'aborted') {
          if (event.error === 'not-allowed') {
            setErrorMessage(voiceLang === 'ar-EG' ? 'تم رفض الوصول للميكروفون' : 'Microphone access denied');
            setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(false); }, 2000);
          } else if (event.error === 'no-speech') {
            setErrorMessage(voiceLang === 'ar-EG' ? 'لم نسمع شيئاً — حاول مجدداً' : 'No speech heard — try again');
            setTimeout(() => setErrorMessage(null), 3000);
          } else if (event.error === 'network') {
            setErrorMessage(voiceLang === 'ar-EG' ? 'خطأ في الشبكة — استخدم لوحة المفاتيح ⌨' : 'Network error — use keyboard ⌨');
            setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(true); }, 2500);
          } else {
            setErrorMessage(voiceLang === 'ar-EG' ? 'تعذر التعرف — اضغط للمحاولة' : 'Voice failed — tap to retry');
            setTimeout(() => setErrorMessage(null), 3500);
          }
        }
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        recognitionRef.current = null;
        setIsListening(false);
      };

      recognition.onend = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        recognitionRef.current = null;
        setIsListening(false);

        // Deliver captured text if available
        const text = capturedTranscriptRef.current;
        capturedTranscriptRef.current = '';
        if (text && text.trim().length > 0) {
          handleCapturedText(text.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      timeoutRef.current = setTimeout(() => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (recognitionRef.current === recognition) {
          try { recognition.stop(); } catch (_) { /* ignore */ }
        }
      }, 10000);
    } catch (e) {
      setIsListening(false);
      stopAndCleanupRecognition();
      onRequestKeyboard?.(false);
    }
  }, [voiceLang, stopAndCleanupRecognition, handleCapturedText, onRequestKeyboard, onRequestOfflineConsent, offlineVoiceStatus, startOfflineRecording]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsProcessing(true);
    if (isOfflineRecording) {
      stopOfflineRecording();
    } else {
      const rec = recognitionRef.current;
      if (rec) {
        try { rec.stop(); } catch (_) { stopAndCleanupRecognition(); }
      } else {
        stopAndCleanupRecognition();
      }
    }
  }, [isOfflineRecording, stopOfflineRecording, stopAndCleanupRecognition]);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const isActive = isListening || isProcessing || !!isWhisperTranscribing;

  return (
    <div className="flex flex-col items-center select-none">

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-1.5 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full"
          >
            {offlineVoiceStatus === 'ready' ? (
              <>
                <Sparkle size={11} className="text-emerald-400" weight="fill" />
                <span className="text-[10px] font-bold text-emerald-400">Offline AI ready</span>
              </>
            ) : (
              <>
                <WifiSlash size={12} className="text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">
                  {offlineVoiceStatus === 'declined' ? 'Offline — use keyboard' : 'Offline — tap mic to set up'}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Recognized Toast Preview */}
      <AnimatePresence>
        {successPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="mb-2 px-3 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 backdrop-blur-md text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xl shadow-emerald-500/10 z-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 350 }}
            >
              <CheckCircle size={17} weight="fill" className="text-emerald-400" />
            </motion.div>
            <span className="truncate max-w-[210px] italic">"{successPreview}"</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language switcher + keyboard */}
      <div className="flex items-center gap-1 mb-2 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg">
        <button
          type="button"
          onClick={() => updateSettings({ voiceLanguage: 'ar-EG' })}
          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${voiceLang === 'ar-EG' ? 'bg-[#0a7ea4] text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          عربي
        </button>
        <button
          type="button"
          onClick={() => updateSettings({ voiceLanguage: 'en-US' })}
          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all ${voiceLang === 'en-US' ? 'bg-[#0a7ea4] text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => onRequestKeyboard?.(isOffline)}
          title="Type instead"
          className="p-1 text-neutral-400 hover:text-white transition-colors ml-0.5"
        >
          <Keyboard size={13} />
        </button>
      </div>

      {/* Main Mic Button */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <motion.div animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute w-20 h-20 rounded-full bg-red-500/30 pointer-events-none" />
            <motion.div animate={{ scale: [1, 1.75, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} className="absolute w-20 h-20 rounded-full bg-red-500/20 pointer-events-none" />
          </>
        )}
        {(isProcessing || !!isWhisperTranscribing) && (
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.08, 1] }}
            transition={{ rotate: { repeat: Infinity, duration: 1.6, ease: 'linear' }, scale: { repeat: Infinity, duration: 1 } }}
            className="absolute w-20 h-20 rounded-full border-2 border-dashed border-[#0a7ea4] pointer-events-none"
          />
        )}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={toggleListening}
          disabled={isProcessing || !!isWhisperTranscribing}
          className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-xl ${
            isListening
              ? 'bg-red-500 text-white shadow-red-500/50 scale-105'
              : isActive
              ? 'bg-[#0a7ea4] text-white shadow-[#0a7ea4]/40'
              : successPreview
              ? 'bg-emerald-500 text-neutral-950 shadow-emerald-500/40'
              : 'bg-gradient-to-tr from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 shadow-[#0a7ea4]/40 hover:shadow-[#0a7ea4]/60'
          }`}
        >
          {isListening ? (
            <StopCircle size={32} weight="fill" />
          ) : isActive ? (
            <Sparkle size={28} weight="fill" className="animate-spin" />
          ) : successPreview ? (
            <CheckCircle size={32} weight="fill" />
          ) : isOffline && offlineVoiceStatus === 'not-asked' ? (
            <CloudArrowDown size={26} weight="duotone" />
          ) : (
            <Microphone size={30} weight="fill" />
          )}
        </motion.button>
      </div>

      {/* Status Labels */}
      <AnimatePresence mode="wait">
        {isListening && (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-bold text-red-400 bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-red-500/30 shadow-md whitespace-nowrap"
          >
            <div className="flex items-center gap-0.5 h-3">
              {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.7, delay: delay * 0.3 }}
                  className="w-0.5 h-full bg-red-400 rounded-full origin-center"
                />
              ))}
            </div>
            <span>
              {isOfflineRecording
                ? (voiceLang === 'ar-EG' ? 'تسجيل... اضغط للتوقف' : 'Recording... tap to stop')
                : (voiceLang === 'ar-EG' ? 'تحدث الآن... (مثال: قهوة 50 جنيه)' : 'Listening... (e.g. Coffee $5)')}
            </span>
          </motion.div>
        )}

        {isWhisperTranscribing && (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-bold text-white bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-[#0a7ea4]/40 shadow-md whitespace-nowrap"
          >
            <Sparkle size={14} weight="fill" className="text-[#0a7ea4] animate-spin" />
            <span>{voiceLang === 'ar-EG' ? 'الذكاء الاصطناعي يحول الصوت...' : 'AI transcribing audio...'}</span>
          </motion.div>
        )}

        {isProcessing && !isWhisperTranscribing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-bold text-white bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-[#0a7ea4]/40 shadow-md whitespace-nowrap"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-3.5 h-3.5 border-2 border-[#0a7ea4]/30 border-t-[#0a7ea4] rounded-full"
            />
            <span>{voiceLang === 'ar-EG' ? 'جاري تحليل المعاملة...' : 'Analyzing voice entry...'}</span>
          </motion.div>
        )}

        {errorMessage && !isListening && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 5, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: [0, -4, 4, -4, 4, 0] }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ x: { duration: 0.35 } }}
            className="mt-2 text-[11px] font-bold text-red-400 bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-red-500/30 shadow-md flex items-center gap-1.5 whitespace-nowrap"
          >
            <Warning size={14} weight="fill" className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


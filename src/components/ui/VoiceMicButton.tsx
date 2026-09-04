import { useState, useRef, useCallback, useEffect } from 'react';
import { Microphone, StopCircle, Sparkle, Keyboard, WifiSlash, CloudArrowDown, CheckCircle, Warning } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  // Hardcode recognition language strictly to Egyptian Arabic (ar-EG)
  const HARDCODED_VOICE_LANG = 'ar-EG';

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
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
      setErrorMessage('لم يتم التقاط صوت — حاول مرة أخرى');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    
    // Trigger Visual Success & Processing Feedback
    setErrorMessage(null);
    setSuccessPreview(text.trim());
    setIsProcessing(true);
    if (onParsingStart) onParsingStart();
    
    // Pass transcript to parent to execute Gemini parsing via Supabase Edge Function
    onTranscript(text.trim());

    setTimeout(() => {
      setIsProcessing(false);
    }, 600);

    setTimeout(() => {
      setSuccessPreview(null);
      setLiveTranscript('');
    }, 3500);
  }, [onParsingStart, onTranscript]);

  // ── Offline recording (MediaRecorder → Whisper) ──────────────
  const startOfflineRecording = useCallback(() => {
    setErrorMessage(null);
    setSuccessPreview(null);
    setLiveTranscript('');
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

  // ── Online: Native Web Speech API (window.SpeechRecognition / webkitSpeechRecognition) ──
  const startListening = useCallback(() => {
    setErrorMessage(null);
    setSuccessPreview(null);
    setLiveTranscript('');

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

    // ── Online: Native SpeechRecognition API ──────────────────
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onRequestKeyboard?.(false);
      return;
    }

    stopAndCleanupRecognition();
    const currentSessionId = ++sessionIdRef.current;
    capturedTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      // Continuous false, interimResults true to display real-time live transcript
      recognition.continuous = false;
      recognition.interimResults = true;
      // Hardcoded strictly to Egyptian Arabic (ar-EG)
      recognition.lang = HARDCODED_VOICE_LANG;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const part = event.results[i]?.[0]?.transcript || '';
          if (event.results[i].isFinal) {
            final += part;
          } else {
            interim += part;
          }
        }

        const currentText = (final || interim || '').trim();
        if (currentText) {
          capturedTranscriptRef.current = currentText;
          setLiveTranscript(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (event.error !== 'aborted') {
          if (event.error === 'not-allowed') {
            setErrorMessage('تم رفض الوصول للميكروفون');
            setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(false); }, 2000);
          } else if (event.error === 'no-speech') {
            setErrorMessage('لم نسمع شيئاً — حاول مجدداً');
            setTimeout(() => setErrorMessage(null), 3000);
          } else if (event.error === 'network') {
            setErrorMessage('خطأ في الشبكة — استخدم لوحة المفاتيح ⌨');
            setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(true); }, 2500);
          } else {
            setErrorMessage('تعذر التعرف — اضغط للمحاولة');
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
        const text = capturedTranscriptRef.current || liveTranscript;
        capturedTranscriptRef.current = '';
        if (text && text.trim().length > 0) {
          handleCapturedText(text.trim());
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

      // Auto-stop timeout if no end event fired after 12s
      timeoutRef.current = setTimeout(() => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (recognitionRef.current === recognition) {
          try { recognition.stop(); } catch (_) { /* ignore */ }
        }
      }, 12000);
    } catch (e) {
      setIsListening(false);
      stopAndCleanupRecognition();
      onRequestKeyboard?.(false);
    }
  }, [stopAndCleanupRecognition, handleCapturedText, onRequestKeyboard, onRequestOfflineConsent, offlineVoiceStatus, startOfflineRecording, liveTranscript]);

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

      {/* ── Active Listening & Live Transcript Display ────────────── */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            className="mb-3 max-w-[340px] w-full bg-neutral-950/95 backdrop-blur-xl border border-red-500/40 rounded-2xl p-3.5 shadow-2xl shadow-red-500/15 flex flex-col items-center text-center gap-2 z-30"
          >
            {/* Listening status indicator with animated soundwave bars */}
            <div className="flex items-center gap-2 text-xs font-extrabold text-red-400">
              <div className="flex items-center gap-1 h-3.5">
                {[0.4, 0.9, 0.6, 1, 0.5, 0.8, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: delay * 0.2 }}
                    className="w-1 h-full bg-red-400 rounded-full origin-center"
                  />
                ))}
              </div>
              <span>جاري الاستماع... (Listening...)</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono">
                ar-EG
              </span>
            </div>

            {/* Live transcript text */}
            <div className="text-sm font-medium text-white px-2 py-1 min-h-[30px] flex items-center justify-center max-w-full" dir="rtl">
              {liveTranscript ? (
                <span className="text-emerald-300 font-bold italic tracking-wide text-base animate-pulse">
                  "{liveTranscript}"
                </span>
              ) : (
                <span className="text-neutral-400 text-xs italic font-medium leading-relaxed">
                  تحدث الآن باللهجة المصرية...
                  <br />
                  <span className="text-neutral-500 text-[11px]">
                    (مثال: "صرفت ٧٠ ج.م في كارفور على البقالة")
                  </span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Recognized Toast Preview */}
      <AnimatePresence>
        {successPreview && !isListening && (
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

      {/* Language badge + keyboard trigger */}
      <div className="flex items-center gap-1.5 mb-2 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
        <span className="text-[11px] font-bold text-white flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          لهجة مصرية (ar-EG)
        </span>
        <div className="w-[1px] h-3 bg-neutral-700 mx-0.5" />
        <button
          type="button"
          onClick={() => onRequestKeyboard?.(isOffline)}
          title="Type instead with keyboard"
          className="p-1 text-neutral-400 hover:text-white transition-colors"
        >
          <Keyboard size={14} />
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
        {isWhisperTranscribing && (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-bold text-white bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-[#0a7ea4]/40 shadow-md whitespace-nowrap"
          >
            <Sparkle size={14} weight="fill" className="text-[#0a7ea4] animate-spin" />
            <span>الذكاء الاصطناعي يحول الصوت...</span>
          </motion.div>
        )}

        {isProcessing && !isWhisperTranscribing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2 text-xs font-bold text-cyan-300 bg-neutral-950/90 px-3.5 py-1.5 rounded-full border border-[#0a7ea4]/40 shadow-md whitespace-nowrap"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-3.5 h-3.5 border-2 border-[#0a7ea4]/30 border-t-[#0a7ea4] rounded-full"
            />
            <span>جاري تحليل المعاملة عبر الذكاء الاصطناعي (Gemini)...</span>
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

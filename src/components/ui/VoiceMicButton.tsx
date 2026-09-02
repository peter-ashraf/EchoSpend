import { useState, useRef, useCallback, useEffect } from 'react';
import { Microphone, StopCircle, Sparkle, Keyboard, WifiSlash, CloudArrowDown } from '@phosphor-icons/react';
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // For offline recording via MediaRecorder
  const offlineRecorderRef = useRef<{ stop: () => void } | null>(null);
  const [isOfflineRecording, setIsOfflineRecording] = useState(false);

  // Session ID pattern: prevents stale callbacks from old recognition sessions
  const sessionIdRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    stopAndCleanupRecognition();
    if (!text || text.trim().length === 0) {
      setErrorMessage('No voice detected. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    setIsProcessing(true);
    if (onParsingStart) onParsingStart();
    onTranscript(text.trim());
    setTimeout(() => {
      setIsProcessing(false);
    }, 450);
  }, [stopAndCleanupRecognition, onParsingStart, onTranscript]);

  // ── Offline recording (MediaRecorder → Whisper) ──────────────
  const startOfflineRecording = useCallback(() => {
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
  }, []);

  // ── Online: Web Speech API ───────────────────────────────────
  const startListening = useCallback(() => {
    setErrorMessage(null);

    // ── Offline path ──────────────────────────────────────────
    if (!navigator.onLine) {
      if (offlineVoiceStatus === 'ready') {
        startOfflineRecording();
      } else if (offlineVoiceStatus === 'not-asked') {
        onRequestOfflineConsent?.();
      } else {
        // declined — go to keyboard
        onRequestKeyboard?.(true);
      }
      return;
    }

    // ── Online: Web Speech API ─────────────────────────────────
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { onRequestKeyboard?.(false); return; }

    stopAndCleanupRecognition();
    const currentSessionId = ++sessionIdRef.current;
    let didGetResult = false;

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
        if (event.results?.[0]?.[0]) {
          didGetResult = true;
          const transcript = event.results[0][0].transcript;
          recognition.onstart = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
          try { recognition.stop(); } catch (_) {}
          recognitionRef.current = null;
          handleCapturedText(transcript);
        }
      };
      recognition.onerror = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (event.error === 'aborted') {
          setIsListening(false);
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied');
          setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(false); }, 1500);
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech heard — try again');
          setTimeout(() => setErrorMessage(null), 3000);
        } else if (event.error === 'network') {
          setErrorMessage('Network error — use keyboard ⌨');
          setTimeout(() => { setErrorMessage(null); onRequestKeyboard?.(true); }, 2000);
        } else {
          setErrorMessage('Voice failed — tap to retry');
          setTimeout(() => setErrorMessage(null), 3500);
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
      };

      recognitionRef.current = recognition;
      recognition.start();
      timeoutRef.current = setTimeout(() => {
        if (sessionIdRef.current !== currentSessionId) return;
        if (!didGetResult && recognitionRef.current === recognition) {
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
    if (isOfflineRecording) {
      stopOfflineRecording();
    } else {
      stopAndCleanupRecognition();
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
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute w-20 h-20 rounded-full bg-[#0a7ea4]/30 pointer-events-none" />
            <motion.div animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }} className="absolute w-20 h-20 rounded-full bg-[#0a7ea4]/20 pointer-events-none" />
          </>
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
              ? 'bg-[#0a7ea4] text-white animate-pulse'
              : 'bg-gradient-to-tr from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 shadow-[#0a7ea4]/40 hover:shadow-[#0a7ea4]/60'
          }`}
        >
          {isListening ? (
            <StopCircle size={32} weight="fill" />
          ) : isActive ? (
            <Sparkle size={28} weight="fill" className="animate-spin" />
          ) : isOffline && offlineVoiceStatus === 'not-asked' ? (
            <CloudArrowDown size={26} weight="duotone" />
          ) : (
            <Microphone size={30} weight="fill" />
          )}
        </motion.button>
      </div>

      {/* Status Labels */}
      <AnimatePresence>
        {isListening && (
          <motion.p key="listening" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-[#0a7ea4] bg-neutral-950/90 px-3 py-1 rounded-full border border-[#0a7ea4]/30 shadow-md animate-pulse whitespace-nowrap"
          >
            {isOfflineRecording
              ? (voiceLang === 'ar-EG' ? 'تسجيل... اضغط للتوقف' : 'Recording... tap to stop')
              : (voiceLang === 'ar-EG' ? 'تحدث الآن... (مثال: قهوة 50 جنيه)' : 'Listening... (e.g. Coffee $5)')}
          </motion.p>
        )}
        {isWhisperTranscribing && (
          <motion.p key="transcribing" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-white bg-neutral-950/90 px-3 py-1 rounded-full border border-neutral-800 shadow-md whitespace-nowrap"
          >
            AI transcribing...
          </motion.p>
        )}
        {isProcessing && !isWhisperTranscribing && (
          <motion.p key="processing" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-white bg-neutral-950/90 px-3 py-1 rounded-full border border-neutral-800 shadow-md whitespace-nowrap"
          >
            Analyzing voice entry...
          </motion.p>
        )}
        {errorMessage && !isListening && (
          <motion.p key="error" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-[11px] font-bold text-red-400 bg-neutral-950/90 px-3 py-1 rounded-full border border-red-500/30 shadow-md whitespace-nowrap"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

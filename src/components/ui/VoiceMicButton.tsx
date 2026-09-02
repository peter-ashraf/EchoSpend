import { useState, useRef, useCallback } from 'react';
import { Microphone, StopCircle, Sparkle, Keyboard } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  onParsingStart?: () => void;
}

export function VoiceMicButton({ onTranscript, onParsingStart }: VoiceMicButtonProps) {
  const { settings, updateSettings } = useStore();
  const voiceLang = settings?.voiceLanguage || 'ar-EG';
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  const cleanupRecognition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleCapturedText = useCallback((text: string) => {
    cleanupRecognition();
    if (!text || text.trim().length === 0) {
      setErrorMessage('No voice detected. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsProcessing(true);
    if (onParsingStart) onParsingStart();

    // Show quick parsing feedback animation for 400ms then open confirm modal
    setTimeout(() => {
      setIsProcessing(false);
      onTranscript(text.trim());
    }, 450);
  }, [cleanupRecognition, onParsingStart, onTranscript]);

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback to manual text input modal if browser has no SpeechRecognition
      setShowManualInput(true);
      return;
    }

    cleanupRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = voiceLang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        // Safety timeout: automatically stop after 8 seconds if no sound
        timeoutRef.current = setTimeout(() => {
          stopListening();
        }, 8000);
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          handleCapturedText(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access blocked in browser');
          setTimeout(() => setShowManualInput(true), 1500);
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech heard. Try again');
        } else {
          setErrorMessage('Voice input failed. Tap to retry');
        }
        cleanupRecognition();
        setTimeout(() => setErrorMessage(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setShowManualInput(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        cleanupRecognition();
      }
    } else {
      cleanupRecognition();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      setShowManualInput(false);
      handleCapturedText(manualText.trim());
      setManualText('');
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      
      {/* 1. Language Switcher Pill (Centered Directly Above Mic) */}
      <div className="flex items-center gap-1 mb-2 bg-neutral-900/90 border border-neutral-800 backdrop-blur-md px-2 py-0.5 rounded-full shadow-lg">
        <button
          type="button"
          onClick={() => updateSettings({ voiceLanguage: voiceLang === 'ar-EG' ? 'en-US' : 'ar-EG' })}
          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all flex items-center gap-1 ${
            voiceLang === 'ar-EG'
              ? 'bg-[#0a7ea4] text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>عربي</span>
        </button>
        <button
          type="button"
          onClick={() => updateSettings({ voiceLanguage: voiceLang === 'en-US' ? 'ar-EG' : 'en-US' })}
          className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-all flex items-center gap-1 ${
            voiceLang === 'en-US'
              ? 'bg-[#0a7ea4] text-white'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <span>EN</span>
        </button>
        <button
          type="button"
          onClick={() => setShowManualInput(true)}
          title="Type by keyboard"
          className="p-1 text-neutral-400 hover:text-white transition-colors ml-0.5"
        >
          <Keyboard size={13} />
        </button>
      </div>

      {/* 2. Main Mic Button */}
      <div className="relative flex items-center justify-center">
        
        {/* Pulsing Outer Rings when Listening */}
        {isListening && (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute w-20 h-20 rounded-full bg-[#0a7ea4]/30 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              className="absolute w-20 h-20 rounded-full bg-[#0a7ea4]/20 pointer-events-none"
            />
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={toggleListening}
          className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-xl ${
            isListening
              ? 'bg-red-500 text-white shadow-red-500/50 scale-105'
              : isProcessing
              ? 'bg-[#0a7ea4] text-white animate-pulse'
              : 'bg-gradient-to-tr from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 shadow-[#0a7ea4]/40 hover:shadow-[#0a7ea4]/60'
          }`}
        >
          {isListening ? (
            <StopCircle size={32} weight="fill" />
          ) : isProcessing ? (
            <Sparkle size={28} weight="fill" className="animate-spin" />
          ) : (
            <Microphone size={30} weight="fill" />
          )}
        </motion.button>
      </div>

      {/* 3. Feedback / Error Labels */}
      <AnimatePresence>
        {isListening && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-[#0a7ea4] bg-neutral-950/90 px-3 py-1 rounded-full border border-[#0a7ea4]/30 shadow-md animate-pulse whitespace-nowrap"
          >
            {voiceLang === 'ar-EG' ? 'تحدث الآن... (مثال: قهوة 50 جنيه)' : 'Listening... (e.g. Coffee $5)'}
          </motion.p>
        )}

        {isProcessing && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-xs font-bold text-white bg-neutral-950/90 px-3 py-1 rounded-full border border-neutral-800 shadow-md whitespace-nowrap"
          >
            Analyzing voice entry...
          </motion.p>
        )}

        {errorMessage && !isListening && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-[11px] font-bold text-red-400 bg-neutral-950/90 px-3 py-1 rounded-full border border-red-500/30 shadow-md whitespace-nowrap"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Fallback Manual Text Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Keyboard size={18} className="text-[#0a7ea4]" />
                Type Voice Phrase
              </h3>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={voiceLang === 'ar-EG' ? 'مثال: ستاربكس 140 جنيه أو غداء 200' : 'e.g. Starbucks $5 or Groceries 200'}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-xs font-bold shadow-md shadow-[#0a7ea4]/20"
                >
                  Parse & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

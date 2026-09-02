import { useState, useRef, useEffect } from 'react';
import { Microphone, StopCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
}

export function VoiceMicButton({ onTranscript }: VoiceMicButtonProps) {
  const { settings, updateSettings } = useStore();
  const lang = settings?.language || 'en';
  const voiceLang = settings?.voiceLanguage || 'en-US';
  
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Set language dynamically from voiceLanguage setting
      recognition.lang = voiceLang;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onTranscript(text);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setError(getTranslation(lang, 'voiceError'));
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setError(getTranslation(lang, 'voiceNotSupported'));
    }
  }, [onTranscript, voiceLang, lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Quick Language Toggle */}
      <button
        onClick={() => {
          if (!isListening) {
            updateSettings({ voiceLanguage: voiceLang === 'en-US' ? 'ar-EG' : 'en-US' });
          }
        }}
        className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm transition-all ${
          isListening ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        } ${
          voiceLang === 'en-US' 
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
            : 'bg-green-500/20 text-green-400 border-green-500/30'
        }`}
      >
        {voiceLang === 'en-US' ? 'EN' : 'عربي'}
      </button>

      <div className="flex flex-col items-center">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`relative flex items-center justify-center w-16 h-16 rounded-3xl transition-all duration-300 ${
            isListening 
              ? 'bg-brand-teal text-brand-dark shadow-[0_0_30px_rgba(89,188,164,0.6)]' 
              : 'bg-gradient-to-tr from-brand-teal to-[#70cfb8] text-brand-dark shadow-teal-glow hover:shadow-[0_0_25px_rgba(89,188,164,0.6)]'
          }`}
        >
          {isListening ? (
            <>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 border-2 border-brand-dark/20 rounded-3xl"
              />
              <StopCircle size={32} weight="fill" />
            </>
          ) : (
            <Microphone size={32} weight="fill" />
          )}
        </motion.button>
        
        {error && (
          <p className="mt-2 text-xs text-red-400 font-medium whitespace-nowrap bg-brand-darker/80 px-2 py-1 rounded">
            {error}
          </p>
        )}
        {isListening && !error && (
          <p className="mt-2 text-xs text-brand-teal font-medium animate-pulse whitespace-nowrap bg-brand-darker/80 px-2 py-1 rounded">
            {getTranslation(lang, 'listening')}
          </p>
        )}
      </div>
    </div>
  );
}

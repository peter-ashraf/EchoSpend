import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, Warning, ArrowClockwise } from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { authenticateWithBiometric } from '../../lib/biometricAuth';
import { useStore } from '../../store/useStore';

interface BiometricLockScreenProps {
  onUnlocked: () => void;
}

export function BiometricLockScreen({ onUnlocked }: BiometricLockScreenProps) {
  const { settings } = useStore();
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUnlock = useCallback(async () => {
    if (!settings?.biometricCredentialId) return;
    setStatus('authenticating');
    setErrorMsg('');

    try {
      const ok = await authenticateWithBiometric(settings.biometricCredentialId);
      if (ok) {
        setStatus('idle');
        onUnlocked();
      } else {
        throw new Error('Authentication returned false');
      }
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Authentication cancelled or failed. Try again.'
        : err?.message || 'Biometric authentication failed.';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [settings?.biometricCredentialId, onUnlocked]);

  useEffect(() => {
    handleUnlock();
  }, [handleUnlock]);

  return (
    <AnimatePresence>
      <motion.div
        key="biometric-lock"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(10,10,10,0.92)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#0a7ea4]/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300, delay: 0.1 }}
          className="relative w-full max-w-xs mx-4 flex flex-col items-center gap-6 p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800/80 shadow-2xl"
          style={{ backdropFilter: 'blur(32px)' }}
        >
          {/* App Logo */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(10,126,164,0)', '0 0 0 16px rgba(10,126,164,0.15)', '0 0 0 0 rgba(10,126,164,0)'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="w-16 h-16 rounded-3xl overflow-hidden shadow-lg shadow-[#0a7ea4]/30 border border-neutral-800"
            >
              <img src="./apple-touch-icon.png" alt="EchoSpend" className="w-full h-full object-cover" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-white font-extrabold text-lg tracking-tight">EchoSpend</h1>
              <p className="text-neutral-500 text-xs font-medium">Locked</p>
            </div>
          </div>

          {/* Lock Icon */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              key={status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                status === 'error'
                  ? 'bg-red-500/10 border-2 border-red-500/30'
                  : status === 'authenticating'
                  ? 'bg-[#0a7ea4]/15 border-2 border-[#0a7ea4]/40'
                  : 'bg-neutral-800/60 border-2 border-neutral-700/60'
              }`}
            >
              {status === 'error' ? (
                <Warning size={36} className="text-red-400" weight="fill" />
              ) : status === 'authenticating' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-9 h-9 border-[3px] border-[#0a7ea4]/30 border-t-[#0a7ea4] rounded-full"
                />
              ) : (
                <Lock size={36} className="text-neutral-400" weight="fill" />
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {status === 'error' && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-medium text-center max-w-[200px]"
                >
                  {errorMsg}
                </motion.p>
              )}
              {status === 'authenticating' && (
                <motion.p
                  key="auth"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-neutral-400 text-xs font-medium text-center"
                >
                  Waiting for biometric...
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Unlock Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleUnlock}
            disabled={status === 'authenticating'}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 font-extrabold text-sm shadow-lg shadow-[#0a7ea4]/30 flex items-center justify-center gap-2.5 disabled:opacity-50 transition-opacity"
          >
            {status === 'error' ? (
              <>
                <ArrowClockwise size={18} weight="bold" />
                Try Again
              </>
            ) : (
              <>
                <Fingerprint size={22} weight="fill" />
                Unlock with Biometrics
              </>
            )}
          </motion.button>

          <p className="text-neutral-600 text-[11px] text-center">
            Use Face ID, Touch ID, or your device fingerprint
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

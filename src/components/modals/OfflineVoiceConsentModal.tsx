import { motion, AnimatePresence } from 'framer-motion';
import { WifiSlash, CloudArrowDown, Check } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';

interface OfflineVoiceConsentModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDecline: () => void;
}

export function OfflineVoiceConsentModal({ isOpen, onAgree, onDecline }: OfflineVoiceConsentModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="offline-voice-consent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#0a7ea4]/20 to-[#2dd4bf]/10 px-6 pt-7 pb-5 flex flex-col items-center gap-4 border-b border-neutral-800">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/20 flex items-center justify-center">
                  <WifiSlash size={32} className="text-[#0a7ea4]" weight="duotone" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <span className="text-amber-400 text-[10px] font-black">!</span>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-white font-extrabold text-lg">Offline Voice Input</h2>
                <p className="text-neutral-400 text-xs mt-1 font-medium">
                  You're offline — voice recognition requires internet
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-neutral-300 text-sm leading-relaxed">
                EchoSpend can download an <span className="text-white font-semibold">AI speech model (~40 MB)</span> to your device so the microphone works{' '}
                <span className="text-[#2dd4bf] font-semibold">completely offline</span> — no internet needed after that.
              </p>

              {/* Features list */}
              <div className="space-y-2.5">
                {[
                  'Works without internet after download',
                  'Supports Arabic & English voice input',
                  'Stored privately on your device',
                  'Download takes ~1–2 minutes on Wi-Fi',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-emerald-400" weight="bold" />
                    </div>
                    <span className="text-neutral-300 text-xs">{item}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60">
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  If you choose <span className="text-white font-semibold">Not Now</span>, you can always download it later from{' '}
                  <span className="text-[#0a7ea4] font-semibold">Settings → Offline Voice Package</span>.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 py-3.5 rounded-2xl border border-neutral-700 text-neutral-300 text-sm font-semibold hover:border-neutral-600 transition-colors"
              >
                Not Now
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onAgree}
                className="flex-[1.4] py-3.5 rounded-2xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 text-sm font-extrabold shadow-lg shadow-[#0a7ea4]/25 flex items-center justify-center gap-2"
              >
                <CloudArrowDown size={18} weight="bold" />
                Download (~40 MB)
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

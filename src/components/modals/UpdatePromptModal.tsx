import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsClockwise, RocketLaunch, Sparkle, X } from '@phosphor-icons/react';

interface UpdatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentVersion?: string;
  isUpdating?: boolean;
}

export function UpdatePromptModal({
  isOpen,
  onClose,
  onUpdate,
  currentVersion = '1.2.0',
  isUpdating = false
}: UpdatePromptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUpdating) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isUpdating]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isUpdating && onClose()}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 z-10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0a7ea4]/20 to-[#2dd4bf]/20 border border-[#0a7ea4]/30 flex items-center justify-center text-[#0a7ea4]">
                  <RocketLaunch size={26} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                    Update Ready
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#0a7ea4]/15 text-[#0a7ea4] border border-[#0a7ea4]/30">
                      v{currentVersion}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400">A new build has been downloaded</p>
                </div>
              </div>

              {!isUpdating && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/20 space-y-1.5 text-xs text-neutral-300">
              <p className="font-semibold text-[#0a7ea4] flex items-center gap-1">
                <Sparkle size={14} weight="fill" /> Instant PWA Refresh
              </p>
              <p className="text-[11px] leading-relaxed text-neutral-400">
                Installed PWAs keep assets cached locally. Tapping <strong>"Reload & Update"</strong> immediately activates the newest version and reloads the application.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              {!isUpdating && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-xs font-semibold"
                >
                  Later
                </button>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={onUpdate}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/25 active:scale-95 disabled:opacity-50"
              >
                <ArrowsClockwise size={16} weight="bold" className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'Updating...' : 'Reload & Update'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

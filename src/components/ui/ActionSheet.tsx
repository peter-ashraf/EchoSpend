import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface Option {
  value: string;
  label: string;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
  lang?: 'en' | 'ar';
}

export function ActionSheet({ isOpen, onClose, title, options, selectedValue, onSelect, lang = 'en' }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-brand-darker border-t border-brand-light/20 rounded-t-3xl z-50 pb-safe shadow-2xl"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 text-brand-gray hover:text-brand-teal transition-colors rounded-full active:scale-95 bg-brand-light/10"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSelect(option.value);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95 ${
                      selectedValue === option.value
                        ? 'bg-brand-teal/20 text-brand-teal font-bold border border-brand-teal/30'
                        : 'bg-brand-light/5 text-brand-gray hover:bg-brand-light/10 border border-transparent font-medium'
                    }`}
                  >
                    <span>{option.label}</span>
                    {selectedValue === option.value && (
                      <div className="w-2 h-2 rounded-full bg-brand-teal" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

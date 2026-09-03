import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { parseBankSms, type ParsedSmsResult } from '../../lib/parseSms';
import { Check, Sparkle, Tag, CreditCard, ClipboardText, X } from '@phosphor-icons/react';

interface SmsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_SMS = [
  {
    name: 'Chillout (Fuel)',
    text: 'CIB: Purchase of EGP 450.00 at CHILLOUT with card ending in 4521. Available balance: EGP 12,500.00'
  },
  {
    name: 'El Ezaby (Pharmacy)',
    text: 'QNB: Purchase of EGP 185.50 at EL EZABY PHARMACY with card ending in 4521.'
  },
  {
    name: 'Total Gas (Apple Pay)',
    text: 'Apple Pay: Approved EGP 550.00 at TOTAL ENERGIES with Chase Visa ****4521.'
  },
  {
    name: 'الوطنية (عربي)',
    text: 'البنك الأهلي: تم تنفيذ عملية شراء لدى محطة الوطنية بمبلغ 350.00 ج.م بالبطاقة المنتهية بـ 4521'
  },
  {
    name: 'Starbucks Coffee',
    text: 'Apple Pay: Approved EGP 145.00 at STARBUCKS with card ending 4521.'
  },
  {
    name: 'Salary Credit',
    text: 'Bank Alert: Your account ****4521 has been credited with EGP 25,000.00 (Salary Deposit).'
  }
];

export function SmsImportModal({ isOpen, onClose, onSuccess }: SmsImportModalProps) {
  const { categories, wallets, addTransaction, settings } = useStore();
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedSmsResult | null>(null);

  const handleTextChange = (text: string) => {
    setSmsText(text);
    if (text.trim().length > 5) {
      const defaultWalletId = wallets[0]?.id || '';
      const result = parseBankSms(text, categories, wallets, defaultWalletId);
      setParsed(result);
    } else {
      setParsed(null);
    }
  };

  const handleApplySample = (sampleText: string) => {
    handleTextChange(sampleText);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleTextChange(text);
        }
      }
    } catch (_) {
      // Ignore clipboard read errors silently
    }
  };

  const handleImport = async () => {
    if (!parsed || parsed.amount <= 0) return;

    await addTransaction({
      amount: parsed.amount,
      walletId: parsed.walletId,
      categoryId: parsed.categoryId,
      type: parsed.type,
      merchant: parsed.merchant,
      note: parsed.note,
      date: parsed.date,
      source: 'sms'
    });

    setSmsText('');
    setParsed(null);
    onSuccess();
    onClose();
  };

  const currencySymbol = settings?.currency || 'EGP';
  const matchedWallet = wallets.find(w => w.id === parsed?.walletId);
  const matchedCategory = categories.find(c => c.id === parsed?.categoryId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auto-Import Bank SMS"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsed || parsed.amount <= 0}
            onClick={handleImport}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
          >
            <Check size={18} weight="bold" />
            Log Expense
          </button>
        </>
      }
    >
      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Bank SMS Notification
            </label>
            <div className="flex items-center gap-1.5">
              {smsText.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSmsText('');
                    setParsed(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400 font-bold px-2 py-0.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all active:scale-95"
                  title="Clear all text"
                >
                  <X size={12} weight="bold" />
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1.5 text-xs text-[#0a7ea4] hover:text-[#2dd4bf] font-bold px-2.5 py-1 rounded-lg bg-[#0a7ea4]/10 transition-colors active:scale-95"
              >
                <ClipboardText size={14} weight="bold" />
                Paste
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={smsText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="e.g. Purchase of EGP 450.00 at TOTAL with card ending in 4521..."
              rows={3}
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#0a7ea4] focus:ring-1 focus:ring-[#0a7ea4] transition-all text-sm resize-none pr-9 theme-input"
            />
            {smsText.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSmsText('');
                  setParsed(null);
                }}
                className="absolute right-3 top-3 w-6 h-6 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-all text-xs"
                title="Clear all text"
              >
                <X size={12} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Test Samples */}
        <div>
          <p className="text-xs text-neutral-400 mb-2 font-medium">Quick test samples (with smart categorization):</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SMS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(sample.text)}
                className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-[#0a7ea4] hover:border-[#0a7ea4]/50 transition-all active:scale-95"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Parsed Preview */}
        {parsed && parsed.amount > 0 && (
          <div className="p-4 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a7ea4] uppercase tracking-wider">
                <Sparkle size={14} weight="fill" /> AI Parsed Result
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                parsed.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {parsed.type.toUpperCase()}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-neutral-400">Merchant / Vendor</p>
                <p className="text-base font-bold text-white">{parsed.merchant || 'Bank Transaction'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400">Amount</p>
                <p className="text-xl font-mono font-extrabold text-[#0a7ea4]">
                  {currencySymbol} {parsed.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#0a7ea4]/20 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <CreditCard size={14} className="text-[#0a7ea4]" />
                <span className="truncate">{matchedWallet?.name || 'Main Account'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Tag size={14} className="text-[#2dd4bf]" />
                <span className="truncate font-semibold text-emerald-300">{matchedCategory?.name || 'General'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

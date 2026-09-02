import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import { parseBankSms, type ParsedSmsResult } from '../../lib/parseSms';
import { Check, Sparkle, Tag, CreditCard } from '@phosphor-icons/react';

interface SmsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_SMS = [
  {
    name: 'CIB Card Purchase',
    text: 'CIB: Purchase of EGP 298.68 at COPA ACAI on 2026-04-07 with card ending in 4521. Available balance: EGP 12,974.64'
  },
  {
    name: 'InstaPay Transfer',
    text: 'InstaPay: You sent EGP 850.00 to MOHAMED AHMED from account ****8834. Reference: Ref-98234.'
  },
  {
    name: 'Apple Pay / Starbucks',
    text: 'Apple Pay: Approved EGP 145.00 at STARBUCKS with Chase Visa ****4521.'
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
    <Modal isOpen={isOpen} onClose={onClose} title="Auto-Import Bank SMS">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Paste Bank SMS Notification
          </label>
          <textarea
            value={smsText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="e.g. Purchase of EGP 298.50 at STARBUCKS with card ending 4521..."
            rows={4}
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#0a7ea4] focus:ring-1 focus:ring-[#0a7ea4] transition-all text-sm resize-none"
          />
        </div>

        {/* Quick Samples */}
        <div>
          <p className="text-xs text-neutral-400 mb-2 font-medium">Try a sample SMS:</p>
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
                <Sparkle size={14} weight="fill" /> Parsed Result
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                parsed.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {parsed.type.toUpperCase()}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-neutral-400">Merchant / Title</p>
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
                <Tag size={14} className="text-[#0a7ea4]" />
                <span className="truncate">{matchedCategory?.name || 'General'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
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
            className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
          >
            <Check size={18} weight="bold" />
            Log Expense
          </button>
        </div>
      </div>
    </Modal>
  );
}

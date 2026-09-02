import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import type { ParsedVoiceTransaction } from '../../lib/parseVoice';
import { Check, CreditCard, Tag, Storefront, Microphone } from '@phosphor-icons/react';

interface VoiceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ParsedVoiceTransaction | null;
  onConfirm: () => void;
}

export function VoiceConfirmModal({ isOpen, onClose, data, onConfirm }: VoiceConfirmModalProps) {
  const { categories, wallets, addTransaction, settings } = useStore();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (data) {
      setAmount(data.amount ? data.amount.toString() : '');
      setMerchant(data.merchant || '');
      setCategoryId(data.categoryId || categories[0]?.id || '');
      setWalletId(data.walletId || wallets[0]?.id || '');
      setType(data.type || 'expense');
      setNote(data.transcript || '');
    }
  }, [data, categories, wallets]);

  if (!data) return null;

  const currencySymbol = settings?.currency || 'EGP';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    await addTransaction({
      amount: numAmount,
      merchant: merchant.trim() || 'Voice Expense',
      categoryId: categoryId || categories[0]?.id || '',
      walletId: walletId || wallets[0]?.id || '',
      type,
      note: note || 'Voice Entry',
      date: new Date().toISOString(),
      source: 'voice'
    });

    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Voice Entry">
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Transcript Speech bubble */}
        <div className="p-3 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 flex items-start gap-2.5">
          <Microphone size={18} className="text-[#0a7ea4] flex-shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-[11px] uppercase font-bold text-[#0a7ea4] tracking-wider">You Said:</p>
            <p className="text-sm font-medium text-white italic">"{data.transcript}"</p>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Amount ({currencySymbol})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0a7ea4]">
              {currencySymbol}
            </span>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-14 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white font-mono text-xl font-extrabold focus:outline-none focus:border-[#0a7ea4] focus:ring-1 focus:ring-[#0a7ea4]"
            />
          </div>
        </div>

        {/* Merchant / Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Merchant / Description
          </label>
          <div className="relative">
            <Storefront size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks, Uber, Groceries"
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>
        </div>

        {/* Category & Wallet Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
              <Tag size={13} className="text-[#0a7ea4]" /> Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#0a7ea4]"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
              <CreditCard size={13} className="text-[#0a7ea4]" /> Paid With
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#0a7ea4]"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] disabled:opacity-50 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
          >
            <Check size={18} weight="bold" />
            Confirm & Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

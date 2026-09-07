import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useStore } from '../../store/useStore';
import type { ParsedVoiceTransaction } from '../../lib/parseVoice';
import { Check, CreditCard, Tag, Storefront, Microphone, Sparkle, Trash } from '@phosphor-icons/react';

interface VoiceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ParsedVoiceTransaction[] | null;
  onConfirm: () => void;
}

export function VoiceConfirmModal({ isOpen, onClose, data, onConfirm }: VoiceConfirmModalProps) {
  const { categories, wallets, addTransaction, settings } = useStore();
  const currencySymbol = settings?.currency || 'EGP';

  // State to hold the array of items to confirm
  const [items, setItems] = useState<ParsedVoiceTransaction[]>([]);

  useEffect(() => {
    if (data && isOpen) {
      setItems(data.map(d => ({ ...d }))); // clone
    } else {
      setItems([]);
    }
  }, [data, isOpen]);

  if (!data || items.length === 0) return null;

  const handleItemChange = (index: number, field: keyof ParsedVoiceTransaction, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (items.length === 1) onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all
    const validItems = items.filter(item => {
      const numAmount = parseFloat(item.amount as any);
      return !isNaN(numAmount) && numAmount > 0;
    });

    if (validItems.length === 0) return;

    // Save all distinct items
    for (const item of validItems) {
      await addTransaction({
        amount: parseFloat(item.amount as any),
        merchant: item.merchant?.trim() || 'Voice Expense',
        categoryId: item.categoryId || categories[0]?.id || '',
        walletId: item.walletId || wallets[0]?.id || '',
        type: item.type || 'expense',
        note: item.note || 'Voice Entry',
        date: new Date().toISOString(),
        source: 'voice'
      });
    }

    onConfirm();
    onClose();
  };

  const transcript = data[0]?.transcript || '';
  const isGemini = data[0]?.source === 'gemini';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Voice Entry"
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
            onClick={handleSave}
            disabled={items.some(item => !item.amount || parseFloat(item.amount as any) <= 0)}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] disabled:opacity-50 text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
          >
            <Check size={18} weight="bold" />
            Save All ({items.length})
          </button>
        </>
      }
    >
      <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
        
        {/* Transcript Speech bubble with dynamic badge */}
        <div className="p-3.5 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 flex items-start gap-2.5">
          <Microphone size={18} className="text-[#0a7ea4] flex-shrink-0 mt-0.5" weight="fill" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[11px] uppercase font-bold text-[#0a7ea4] tracking-wider">
                Voice Input
              </p>
              {isGemini ? (
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Sparkle size={10} weight="fill" className="text-cyan-400" />
                  Gemini AI
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  Local Parser
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white italic" dir="auto">"{transcript}"</p>
          </div>
        </div>

        {/* List of Extracted Items */}
        {items.map((item, index) => (
          <div key={index} className="relative p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
            
            {items.length > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase">Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 bg-neutral-800 rounded-lg transition-colors"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
            )}

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
                  inputMode="decimal"
                  required
                  value={item.amount || ''}
                  onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-14 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white font-mono text-xl font-extrabold focus:outline-none focus:border-[#0a7ea4]"
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
                  value={item.merchant || ''}
                  onChange={(e) => handleItemChange(index, 'merchant', e.target.value)}
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
                  value={item.categoryId || ''}
                  onChange={(e) => handleItemChange(index, 'categoryId', e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#0a7ea4]"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>

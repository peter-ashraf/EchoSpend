import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useStore } from '../../store/useStore';
import type { Transaction } from '../../lib/db';
import { Trash, Check, Storefront, Calendar, CreditCard, Tag } from '@phosphor-icons/react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { categories, wallets, deleteTransaction, addTransaction, settings } = useStore();

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setMerchant(transaction.merchant || '');
      setCategoryId(transaction.categoryId || categories[0]?.id || '');
      setWalletId(transaction.walletId || wallets[0]?.id || '');
      setType(transaction.type);
      setDate(transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNote(transaction.note || '');
    }
  }, [transaction, categories, wallets]);

  if (!transaction) return null;

  const currencySymbol = settings?.currency || 'EGP';

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Delete old transaction and add updated one to preserve balance calculations
    await deleteTransaction(transaction.id);
    await addTransaction({
      amount: numAmount,
      merchant: merchant.trim() || 'Transaction',
      categoryId: categoryId || categories[0]?.id || '',
      walletId: walletId || wallets[0]?.id || '',
      type,
      note,
      date: new Date(date).toISOString(),
      source: transaction.source
    });

    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaction">
      <form onSubmit={handleUpdate} className="space-y-4">
        
        {/* Amount */}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-14 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white font-mono text-xl font-extrabold focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Merchant / Place
          </label>
          <div className="relative">
            <Storefront size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
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

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
            <Calendar size={13} className="text-[#0a7ea4]" /> Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#0a7ea4]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center"
            title="Delete Entry"
          >
            <Trash size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
          >
            <Check size={18} weight="bold" />
            Update
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (transaction) {
            await deleteTransaction(transaction.id);
            onClose();
          }
        }}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
      />
    </Modal>
  );
}

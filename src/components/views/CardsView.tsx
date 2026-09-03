import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Wallet } from '../../lib/db';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Plus, CreditCard, Trash, Check } from '@phosphor-icons/react';

const CARD_COLORS = [
  { name: 'Teal (EchoSpend)', color: '#0a7ea4' },
  { name: 'Midnight', color: '#1e293b' },
  { name: 'Gold / Amex', color: '#d97706' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Purple', color: '#7c3aed' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Orange', color: '#ea580c' }
];

export function CardsView() {
  const { wallets, transactions, addWallet, updateWallet, deleteWallet, settings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<Wallet['type']>('checking');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#0a7ea4');
  const [last4, setLast4] = useState('');
  const [institution, setInstitution] = useState('');

  const currencySymbol = settings?.currency || 'EGP';

  // Calculate spent per wallet for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const spentPerWallet = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      const dt = new Date(t.date);
      if (t.type === 'expense' && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
        map[t.walletId] = (map[t.walletId] || 0) + t.amount;
      }
    });
    return map;
  }, [transactions, currentMonth, currentYear]);

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }, [wallets]);

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setName('');
    setType('checking');
    setBalance('');
    setColor('#0a7ea4');
    setLast4('');
    setInstitution('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setBalance(w.balance.toString());
    setColor(w.color);
    setLast4(w.last4 || '');
    setInstitution(w.institution || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (!name || isNaN(numBalance)) return;

    if (editingWallet) {
      await updateWallet({
        ...editingWallet,
        name,
        type,
        balance: numBalance,
        color,
        last4: last4.trim() ? last4.trim() : undefined,
        institution: institution.trim() ? institution.trim() : undefined
      });
    } else {
      await addWallet({
        name,
        type,
        balance: numBalance,
        color,
        last4: last4.trim() ? last4.trim() : undefined,
        institution: institution.trim() ? institution.trim() : undefined
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Manage Cards</h2>
          <p className="text-xs text-neutral-400 font-medium">Bank accounts & digital wallets</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-xs font-bold transition-all shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
        >
          <Plus size={16} weight="bold" />
          <span>Add Card</span>
        </button>
      </div>

      {/* Net Balance Banner */}
      <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Net Balance</p>
          <p className="text-2xl font-extrabold font-mono text-white mt-1">
            {currencySymbol} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-[#0a7ea4]/10 text-[#0a7ea4] border border-[#0a7ea4]/20">
          <CreditCard size={28} weight="duotone" />
        </div>
      </div>

      {/* Apple Wallet Style Cards List */}
      <div className="space-y-4">
        {wallets.map((wallet) => {
          const spentThisMonth = spentPerWallet[wallet.id] || 0;

          return (
            <div
              key={wallet.id}
              onClick={() => handleOpenEdit(wallet)}
              className="relative overflow-hidden rounded-3xl p-6 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99] border border-white/10 credit-card"
              style={{
                background: `linear-gradient(135deg, ${wallet.color}ee, ${wallet.color}99 60%, #000000dd)`
              }}
            >
              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Card Top Row */}
              <div className="flex items-start justify-between relative z-10 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">
                    {wallet.institution || wallet.type.toUpperCase()}
                  </p>
                  <h3 className="text-lg font-bold text-white tracking-wide">{wallet.name}</h3>
                </div>
                
                {/* Chip / Card Icon */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-6 rounded-md bg-amber-200/40 border border-amber-300/40 flex items-center justify-center">
                    <div className="w-4 h-3 border border-amber-400/60 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-6 relative z-10">
                <p className="font-mono text-sm tracking-widest text-white/80">
                  •••• •••• •••• {wallet.last4 || '8834'}
                </p>
              </div>

              {/* Card Bottom Row: Spent vs Balance */}
              <div className="flex items-end justify-between pt-4 border-t border-white/15 relative z-10">
                <div>
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">TOTAL SPENT</p>
                  <p className="text-xs font-mono font-bold text-white/90">
                    {currencySymbol} {spentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-wider">BALANCE</p>
                  <p className="text-base font-mono font-extrabold text-white">
                    {currencySymbol} {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Wallet Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWallet ? 'Edit Card' : 'Add New Card'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Account / Card Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chase Checking, Amex Gold, InstaPay"
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Account Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
              >
                <option value="checking">Checking Account</option>
                <option value="credit">Credit Card</option>
                <option value="savings">Savings Account</option>
                <option value="cash">Cash</option>
                <option value="digital">Digital Wallet (Vodafone/InstaPay)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Current Balance ({currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Last 4 Digits
              </label>
              <input
                type="text"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                placeholder="4521"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Bank / Provider
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. CIB, Chase, NBE"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Card Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CARD_COLORS.map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c.color ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editingWallet && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
            >
              <Check size={18} weight="bold" />
              {editingWallet ? 'Update Card' : 'Save Card'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (editingWallet) {
            await deleteWallet(editingWallet.id);
            setIsModalOpen(false);
          }
        }}
        title="Delete Wallet / Card"
        message={`Are you sure you want to delete "${editingWallet?.name}"? All associated account history will be affected.`}
        confirmText="Delete"
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useStore } from '../../store/useStore';
import type { Subscription } from '../../lib/db';
import { Trash, Check } from '@phosphor-icons/react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

const PRESET_SERVICES = [
  { name: 'Netflix', color: '#E50914', icon: 'Television', category: 'Subscriptions & Bills', amount: 320 },
  { name: 'Spotify', color: '#1DB954', icon: 'Headphones', category: 'Subscriptions & Bills', amount: 89.99 },
  { name: 'iCloud+', color: '#007AFF', icon: 'Cloud', category: 'Subscriptions & Bills', amount: 99.99 },
  { name: 'ChatGPT Plus', color: '#10A37F', icon: 'Sparkle', category: 'Subscriptions & Bills', amount: 1000 },
  { name: 'YouTube Premium', color: '#FF0000', icon: 'Play', category: 'Subscriptions & Bills', amount: 120 },
  { name: 'Amazon Prime', color: '#FF9900', icon: 'ShoppingBag', category: 'Subscriptions & Bills', amount: 50 },
  { name: 'Gym Membership', color: '#8B5CF6', icon: 'Barbell', category: 'Health & Fitness', amount: 850 }
];

export function SubscriptionModal({ isOpen, onClose, subscription }: SubscriptionModalProps) {
  const { categories, wallets, addSubscription, updateSubscription, deleteSubscription, settings } = useStore();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [brandColor, setBrandColor] = useState('#0a7ea4');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount.toString());
      setBillingCycle(subscription.billingCycle);
      setNextBillingDate(subscription.nextBillingDate);
      setCategoryId(subscription.categoryId);
      setWalletId(subscription.walletId || wallets[0]?.id || '');
      setBrandColor(subscription.brandColor || '#0a7ea4');
      setNotes(subscription.notes || '');
      setActive(subscription.active);
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setName('');
      setAmount('');
      setBillingCycle('monthly');
      setNextBillingDate(tomorrow.toISOString().split('T')[0]);
      setCategoryId(categories[0]?.id || '');
      setWalletId(wallets[0]?.id || '');
      setBrandColor('#0a7ea4');
      setNotes('');
      setActive(true);
    }
  }, [subscription, isOpen, categories, wallets]);

  const handleApplyPreset = (preset: typeof PRESET_SERVICES[0]) => {
    setName(preset.name);
    setAmount(preset.amount.toString());
    setBrandColor(preset.color);
    const cat = categories.find(c => c.name.toLowerCase().includes('sub') || c.name.toLowerCase().includes('bill'));
    if (cat) setCategoryId(cat.id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name || isNaN(numAmount) || numAmount <= 0) return;

    if (subscription) {
      await updateSubscription(subscription.id, {
        name,
        amount: numAmount,
        billingCycle,
        nextBillingDate,
        categoryId: categoryId || categories[0]?.id || '',
        walletId,
        brandColor,
        notes,
        active
      });
    } else {
      await addSubscription({
        name,
        amount: numAmount,
        currency: settings?.currency || 'EGP',
        billingCycle,
        nextBillingDate,
        categoryId: categoryId || categories[0]?.id || '',
        walletId,
        brandColor,
        notes,
        active
      });
    }

    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={subscription ? 'Edit Subscription' : 'Add Subscription'}>
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* Quick Presets */}
        {!subscription && (
          <div>
            <p className="text-xs text-neutral-400 mb-2 font-medium">Quick Pick Service:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_SERVICES.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-[#0a7ea4] transition-all active:scale-95"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Service / Subscription Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Netflix, Spotify, Gym"
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Amount ({settings?.currency || 'EGP'})
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Billing Cycle
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Next Renewal Date
            </label>
            <input
              type="date"
              required
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Payment Account
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
          <div>
            <p className="text-sm font-semibold text-white">Active Subscription</p>
            <p className="text-xs text-neutral-400">Include in monthly spending total</p>
          </div>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-[#0a7ea4]' : 'bg-neutral-800'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${active ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          {subscription && (
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
            {subscription ? 'Update' : 'Save'}
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (subscription) {
            await deleteSubscription(subscription.id);
            onClose();
          }
        }}
        title="Delete Subscription"
        message={`Are you sure you want to delete "${subscription?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </Modal>
  );
}

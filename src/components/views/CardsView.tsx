import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Wallet } from '../../lib/db';
import { Modal } from '../ui/Modal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { RealisticCard } from '../ui/RealisticCard';
import { Plus, CreditCard, Trash, Check, Sparkle } from '@phosphor-icons/react';
import { formatAmount } from '../../lib/formatters';

const CARD_COLORS = [
  { name: 'Teal (EchoSpend)', color: '#0a7ea4' },
  { name: 'CIB Prime', color: '#35989e' },
  { name: 'CIB Plus', color: '#154c9a' },
  { name: 'Obsidian Black', color: '#0c0d0e' },
  { name: 'Gold Luxury', color: '#d4af37' },
  { name: 'NBE Green', color: '#05472a' },
  { name: 'Banque Misr', color: '#7a1b28' },
  { name: 'Purple', color: '#7c3aed' },
];

export function CardsView() {
  const { wallets, transactions, addWallet, updateWallet, deleteWallet, settings, toggleHideBalance } = useStore();
  const hideBalance = settings?.hideBalance ?? false;
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
  const [bank, setBank] = useState<NonNullable<Wallet['bank']>>('cib');
  const [accountTier, setAccountTier] = useState<NonNullable<Wallet['accountTier']>>('prime');
  const [creditTier, setCreditTier] = useState<NonNullable<Wallet['creditTier']>>('platinum');
  const [network, setNetwork] = useState<NonNullable<Wallet['network']>>('mastercard');
  const [cardholderName, setCardholderName] = useState('PETER ASHRAF');
  const [expiryDate, setExpiryDate] = useState('12/28');

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
    setColor('#35989e');
    setLast4('');
    setInstitution('CIB Egypt');
    setBank('cib');
    setAccountTier('prime');
    setCreditTier('platinum');
    setNetwork('mastercard');
    setCardholderName('PETER ASHRAF');
    setExpiryDate('12/28');
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
    setBank(w.bank || 'cib');
    setAccountTier(w.accountTier || 'prime');
    setCreditTier(w.creditTier || 'platinum');
    setNetwork(w.network || 'mastercard');
    setCardholderName(w.cardholderName || 'PETER RYAD');
    setExpiryDate(w.expiryDate || '12/28');
    setIsModalOpen(true);
  };

  // Preview object for modal
  const previewWallet: Partial<Wallet> = {
    name: name || (type === 'credit' ? 'CIB Platinum Credit' : 'CIB Prime Debit'),
    type,
    balance: parseFloat(balance) || 0,
    color,
    last4: last4 || '5678',
    institution: institution || (bank === 'cib' ? 'CIB Egypt' : bank.toUpperCase()),
    bank,
    accountTier,
    creditTier,
    network,
    cardholderName,
    expiryDate
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (!name || isNaN(numBalance)) return;

    const payload = {
      name,
      type,
      balance: numBalance,
      color,
      last4: last4.trim() ? last4.trim() : undefined,
      institution: institution.trim() ? institution.trim() : undefined,
      bank,
      accountTier: type !== 'credit' ? accountTier : undefined,
      creditTier: type === 'credit' ? creditTier : undefined,
      network,
      cardholderName: cardholderName.trim() ? cardholderName.trim() : undefined,
      expiryDate: expiryDate.trim() ? expiryDate.trim() : undefined
    };

    if (editingWallet) {
      await updateWallet({
        ...editingWallet,
        ...payload
      });
    } else {
      await addWallet(payload);
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
          <p className="text-xs text-neutral-400 font-medium">Physical bank cards & wallets</p>
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
      <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between cursor-pointer" onClick={toggleHideBalance} title="Click to hide/show balance">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Net Balance</p>
          <p className="text-2xl font-extrabold font-mono text-white mt-1">
            {formatAmount(totalBalance, currencySymbol, hideBalance)}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-[#0a7ea4]/10 text-[#0a7ea4] border border-[#0a7ea4]/20">
          <CreditCard size={28} weight="duotone" />
        </div>
      </div>

      {/* Photorealistic Cards List */}
      <div className="space-y-6">
        {wallets.length === 0 ? (
          <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/20 flex items-center justify-center text-[#0a7ea4] mx-auto">
              <CreditCard size={28} weight="duotone" />
            </div>
            <h3 className="text-base font-bold text-white">No Accounts or Cards Yet</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Add your bank cards, digital wallets, or cash accounts to track balances and manage your finances with real-life card designs.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-xs font-bold transition-all shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
            >
              <Plus size={16} weight="bold" />
              <span>Add First Account</span>
            </button>
          </div>
        ) : (
          wallets.map((wallet) => {
            const spentThisMonth = spentPerWallet[wallet.id] || 0;

            return (
              <div key={wallet.id} className="space-y-2 group">
                <RealisticCard
                  wallet={wallet}
                  spentThisMonth={spentThisMonth}
                  currencySymbol={currencySymbol}
                  showBalance={true}
                  onClick={() => handleOpenEdit(wallet)}
                />

                {/* Sub-card quick info */}
                <div className="flex items-center justify-between px-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-medium">Spent this month:</span>
                    <span className="font-mono font-bold text-white">
                      {currencySymbol} {spentThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(wallet)}
                    className="text-[#0a7ea4] hover:underline font-semibold text-[11px]"
                  >
                    Manage Card
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Wallet Modal with Live Card Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWallet ? 'Edit Bank Card' : 'Add Bank Card'}
        footer={
          <>
            {editingWallet && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Delete Card"
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
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
            >
              <Check size={18} weight="bold" />
              {editingWallet ? 'Update Card' : 'Save Card'}
            </button>
          </>
        }
      >
        <div className="space-y-4 p-4">
          
          {/* Live Realistic Card Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkle size={14} className="text-[#0a7ea4]" weight="fill" />
                Live Card Preview
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                {bank.toUpperCase()} • {type === 'credit' ? creditTier.toUpperCase() : accountTier.toUpperCase()}
              </span>
            </div>
            <div className="transform transition-all">
              <RealisticCard wallet={previewWallet} showBalance={false} />
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Bank / Financial Institution
            </label>
            <select
              value={bank}
              onChange={(e) => {
                const b = e.target.value as any;
                setBank(b);
                if (b === 'cib') {
                  setInstitution('CIB Egypt');
                  setColor('#35989e');
                  if (!name) setName(type === 'credit' ? 'CIB Platinum' : 'CIB Prime');
                } else if (b === 'nbe') {
                  setInstitution('National Bank of Egypt');
                  setColor('#05472a');
                  if (!name) setName('NBE Al-Ahli');
                } else if (b === 'banque-misr') {
                  setInstitution('Banque Misr');
                  setColor('#7a1b28');
                  if (!name) setName('Banque Misr');
                } else if (b === 'qnb') {
                  setInstitution('QNB Alahli');
                  setColor('#4b1124');
                  if (!name) setName('QNB Card');
                } else if (b === 'hsbc') {
                  setInstitution('HSBC Egypt');
                  setColor('#1a1a1a');
                  if (!name) setName('HSBC Platinum');
                }
              }}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            >
              <option value="cib">Commercial International Bank (CIB)</option>
              <option value="nbe">National Bank of Egypt (NBE - الأهلي)</option>
              <option value="banque-misr">Banque Misr (بنك مصر)</option>
              <option value="qnb">QNB Alahli</option>
              <option value="hsbc">HSBC Egypt</option>
              <option value="enbd">Emirates NBD</option>
              <option value="alexbank">Bank of Alexandria</option>
              <option value="aaib">Arab African Intl Bank (AAIB)</option>
              <option value="other">Other / International Bank</option>
            </select>
          </div>

          {/* Account Type & Tiers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Card Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  setType(newType);
                  if (newType === 'credit') {
                    if (bank === 'cib') setColor('#0c0d0e');
                  } else {
                    if (bank === 'cib') setColor('#35989e');
                  }
                }}
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
              >
                <option value="checking">Debit Card / Checking</option>
                <option value="credit">Credit Card</option>
                <option value="savings">Savings Account</option>
                <option value="digital">Digital Wallet / InstaPay</option>
                <option value="cash">Cash Account</option>
              </select>
            </div>

            {/* Dynamic Tier Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                {type === 'credit' ? 'Credit Card Tier' : 'Account Tier'}
              </label>
              {type === 'credit' ? (
                <select
                  value={creditTier}
                  onChange={(e) => {
                    const ct = e.target.value as any;
                    setCreditTier(ct);
                    if (ct === 'gold') setColor('#d4af37');
                    if (ct === 'platinum') setColor('#0c0d0e');
                    if (ct === 'titanium') setColor('#4a5568');
                  }}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
                >
                  <option value="platinum">Platinum (بلاتينيوم)</option>
                  <option value="titanium">Titanium (تيتانيوم)</option>
                  <option value="gold">Gold (ذهبية)</option>
                  <option value="world">World / Miles (وورلد)</option>
                  <option value="world-elite">World Elite (وورلد إيليت)</option>
                  <option value="classic">Classic / Standard</option>
                  <option value="infinite">Infinite (إنفينيت)</option>
                </select>
              ) : (
                <select
                  value={accountTier}
                  onChange={(e) => {
                    const at = e.target.value as any;
                    setAccountTier(at);
                    if (at === 'prime') setColor('#35989e');
                    if (at === 'plus') setColor('#154c9a');
                    if (at === 'wealth') setColor('#1f252d');
                    if (at === 'private') setColor('#0d0d0d');
                  }}
                  className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
                >
                  <option value="prime">Prime (برايم)</option>
                  <option value="plus">Plus (بلس)</option>
                  <option value="wealth">Wealth (ويلث)</option>
                  <option value="private">Private (برايفت)</option>
                  <option value="standard">Standard Debit</option>
                </select>
              )}
            </div>
          </div>

          {/* Payment Network & Cardholder Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Payment Network
              </label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="meeza">Meeza (ميزة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                placeholder="PETER RYAD"
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono uppercase text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>
          </div>

          {/* Card Nickname */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Card Nickname / Account Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CIB Salary Account or CIB Platinum Credit"
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>

          {/* Balance, Expiry & Last 4 Digits (All numpad enabled) */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Balance ({currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="^(0[1-9]|1[0-2])\/[0-9]{2}$"
                maxLength={5}
                value={expiryDate}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^\d/]/g, '');
                  if (val.length === 2 && !val.includes('/')) val += '/';
                  setExpiryDate(val);
                }}
                placeholder="12/28"
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Last 4 Digits
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="5678"
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-[#0a7ea4]"
              />
            </div>
          </div>

          {/* Custom Color Accent */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Color Accent Override
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CARD_COLORS.map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
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

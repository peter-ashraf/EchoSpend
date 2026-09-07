import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { ArrowUpRight, ArrowDownRight, Swap, CalendarBlank, NotePencil, Check, Wallet, CaretRight, Warning } from '@phosphor-icons/react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ActionSheet } from '../ui/ActionSheet';
import { Modal } from '../ui/Modal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    amount?: number | null;
    categoryId?: string | null;
    walletId?: string | null;
    type?: 'expense' | 'income' | null;
    note?: string;
  };
}

export function TransactionModal({ isOpen, onClose, initialData }: TransactionModalProps) {
  const { settings, wallets, categories, addTransaction } = useStore();
  
  const initialType = initialData?.type || 'expense';
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(initialType);
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  
  // Default wallet to first available wallet
  const [walletId, setWalletId] = useState(initialData?.walletId || wallets[0]?.id || '');
  const [targetWalletId, setTargetWalletId] = useState(
    wallets.find(w => w.id !== (initialData?.walletId || wallets[0]?.id))?.id || ''
  );

  // Pre-select category so categoryId is NEVER empty
  const defaultCategoryId = useMemo(() => {
    if (initialData?.categoryId) return initialData.categoryId;
    const match = categories.find(c => c.type === initialType);
    return match ? match.id : (categories[0]?.id || '');
  }, [initialData, categories, initialType]);

  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  const [targetWalletSheetOpen, setTargetWalletSheetOpen] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleTypeChange = (newType: 'expense' | 'income' | 'transfer') => {
    setType(newType);
    setErrorMsg(null);
    if (newType !== 'transfer') {
      const match = categories.find(c => c.type === newType);
      if (match) setCategoryId(match.id);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح أكبر من 0' : 'Please enter a valid amount greater than 0');
      return;
    }

    const effectiveWalletId = walletId || wallets[0]?.id;
    if (!effectiveWalletId) {
      setErrorMsg(lang === 'ar' ? 'يرجى اختيار الحساب أو المحفظة' : 'Please select an account or wallet');
      return;
    }

    let effectiveCatId = categoryId;
    let effectiveTargetWalletId: string | undefined = undefined;

    if (type === 'transfer') {
      effectiveCatId = 'transfer';
      effectiveTargetWalletId = targetWalletId || wallets.find(w => w.id !== effectiveWalletId)?.id;
      if (!effectiveTargetWalletId || effectiveTargetWalletId === effectiveWalletId) {
        setErrorMsg(
          lang === 'ar'
            ? 'يرجى اختيار حسابين مختلفين للتحويل'
            : 'Please select two different accounts for the transfer'
        );
        return;
      }
    } else {
      if (!effectiveCatId) {
        effectiveCatId = filteredCategories[0]?.id || categories[0]?.id || '';
      }
      if (!effectiveCatId) {
        setErrorMsg(lang === 'ar' ? 'يرجى اختيار التصنيف' : 'Please select a category');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await addTransaction({
        walletId: effectiveWalletId,
        targetWalletId: type === 'transfer' ? effectiveTargetWalletId : undefined,
        categoryId: effectiveCatId,
        amount: numAmount,
        type,
        note: note.trim(),
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
      
      // Reset state and close
      setAmount('');
      setNote('');
      setErrorMsg(null);
      onClose();
    } catch (err: any) {
      console.error('Failed to save transaction:', err);
      setErrorMsg(err?.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : settings.currency === 'EGP' ? 'ج.م ' : '¥';

  const modalTitle = lang === 'ar' ? 'إضافة معاملة جديدة' : 'Add Transaction';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footer={
        <div className="w-full flex flex-col gap-2.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <Warning size={16} weight="fill" className="shrink-0 text-red-400" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-800 transition-colors text-sm font-semibold"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSubmitting}
              className="flex-[2] py-3 px-4 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#0a7ea4]/25 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check weight="bold" size={18} />
                  <span>{t('saveTransaction')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Pinned Type Switcher (Fixed directly below modal header) */}
        <div className="shrink-0 p-3 bg-neutral-900 border-b border-neutral-800/80 z-10">
          <div className="flex bg-neutral-950/80 border border-neutral-800 p-1 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map((t_val) => {
              const isSelected = type === t_val;
              return (
                <button
                  key={t_val}
                  type="button"
                  onClick={() => handleTypeChange(t_val)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                    isSelected
                      ? t_val === 'expense'
                        ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30'
                        : t_val === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                        : 'bg-[#0a7ea4]/20 text-[#0a7ea4] shadow-sm border border-[#0a7ea4]/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {t_val === 'expense' ? <ArrowUpRight weight="bold" /> : t_val === 'income' ? <ArrowDownRight weight="bold" /> : <Swap weight="bold" />}
                  {t(t_val)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Middle Content */}
        <div className="p-4 space-y-5">
          
          {/* Amount Input */}
          <div className="space-y-1.5 bg-neutral-950/60 border border-neutral-800/80 p-4 rounded-2xl">
            <label className="block text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t('amount')} ({currencySymbol})
            </label>
            <div className="flex items-center justify-center gap-2" style={{ direction: 'ltr' }}>
              <span className="text-2xl font-bold text-[#0a7ea4]">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                required
                autoFocus
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMsg(null);
                }}
                className="bg-transparent text-[#0a7ea4] text-5xl font-mono font-extrabold w-48 text-center outline-none placeholder:text-[#0a7ea4]/20"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category Selection (if not transfer) */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {t('category')}
              </label>
              <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 snap-x no-scrollbar">
                {filteredCategories.map(c => {
                  const isSelected = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(c.id);
                        setErrorMsg(null);
                      }}
                      className={`min-w-[85px] snap-start flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-[#0a7ea4]/20 border-[#0a7ea4] text-cyan-300 shadow-md shadow-[#0a7ea4]/20 scale-105' 
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xl"><CategoryIcon name={c.iconName} size={22} /></div>
                      <span className="text-xs font-medium truncate w-full text-center">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Account / Wallet Selection */}
          <button 
            type="button"
            onClick={() => setWalletSheetOpen(true)}
            className="w-full bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5 flex justify-between items-center active:scale-[0.99] transition-all hover:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-800/80 flex items-center justify-center text-neutral-300">
                <Wallet size={18} />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {type === 'transfer' ? (lang === 'ar' ? 'من حساب' : 'Transfer From') : t('account')}
                </span>
                <span className="text-neutral-100 font-bold text-sm flex items-center gap-1.5">
                  {wallets.find(w => w.id === (walletId || wallets[0]?.id))?.type === 'cash' ? '💵 ' : '💳 '}
                  {wallets.find(w => w.id === (walletId || wallets[0]?.id))?.name || 'Select Account'}
                </span>
              </div>
            </div>
            <CaretRight size={18} className="text-neutral-500" />
          </button>

          {/* Transfer Destination Wallet (if transfer) */}
          {type === 'transfer' && (
            <button
              type="button"
              onClick={() => setTargetWalletSheetOpen(true)}
              className="w-full bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5 flex items-center justify-between hover:border-[#0a7ea4]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {lang === 'ar' ? 'إلى حساب' : 'Transfer To'}
                  </span>
                  <span className="text-neutral-100 font-bold text-sm flex items-center gap-1.5">
                    {wallets.find(w => w.id === targetWalletId)?.type === 'cash' ? '💵 ' : '💳 '}
                    {wallets.find(w => w.id === targetWalletId)?.name || (lang === 'ar' ? 'اختر الحساب المستلم' : 'Select Destination Account')}
                  </span>
                </div>
              </div>
              <CaretRight size={18} className="text-neutral-500" />
            </button>
          )}

          {/* Date Selection */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-2">
              <CalendarBlank size={16} />
              {t('date')}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-neutral-200 outline-none text-sm font-medium"
            />
          </div>

          {/* Note Input */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-3.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-2">
              <NotePencil size={16} />
              {t('note')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-transparent text-neutral-200 outline-none text-sm placeholder:text-neutral-600"
              placeholder={t('whatWasThisFor')}
            />
          </div>

        </div>

        <ActionSheet
          isOpen={walletSheetOpen}
          onClose={() => setWalletSheetOpen(false)}
          title={type === 'transfer' ? (lang === 'ar' ? 'من حساب' : 'Transfer From') : t('account')}
          options={wallets.map(w => ({
            value: w.id,
            label: w.type === 'cash' ? `💵 ${w.name} (Cash)` : `💳 ${w.name}`
          }))}
          selectedValue={walletId || wallets[0]?.id || ''}
          onSelect={(val) => {
            setWalletId(val);
            setErrorMsg(null);
          }}
          lang={lang}
        />

        <ActionSheet
          isOpen={targetWalletSheetOpen}
          onClose={() => setTargetWalletSheetOpen(false)}
          title={lang === 'ar' ? 'إلى حساب' : 'Transfer To'}
          options={wallets.filter(w => w.id !== (walletId || wallets[0]?.id)).map(w => ({
            value: w.id,
            label: w.type === 'cash' ? `💵 ${w.name} (Cash)` : `💳 ${w.name}`
          }))}
          selectedValue={targetWalletId}
          onSelect={(val) => {
            setTargetWalletId(val);
            setErrorMsg(null);
          }}
          lang={lang}
        />

      </div>
    </Modal>
  );
}

// Backward-compatible wrapper
export function TransactionForm({ onSuccess, initialData }: { onSuccess: () => void; initialData?: TransactionModalProps['initialData'] }) {
  return (
    <TransactionModal
      isOpen={true}
      onClose={onSuccess}
      initialData={initialData}
    />
  );
}

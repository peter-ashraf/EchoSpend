import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { ArrowUpRight, ArrowDownRight, Swap, CalendarBlank, NotePencil, Check, Wallet, CaretRight } from '@phosphor-icons/react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ActionSheet } from '../ui/ActionSheet';

interface TransactionFormProps {
  onSuccess: () => void;
  initialData?: {
    amount?: number | null;
    categoryId?: string | null;
    walletId?: string | null;
    type?: 'expense' | 'income' | null;
    note?: string;
  };
}

export function TransactionForm({ onSuccess, initialData }: TransactionFormProps) {
  const { settings, wallets, categories, addTransaction } = useStore();
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [walletId, setWalletId] = useState(initialData?.walletId || wallets[0]?.id || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [note, setNote] = useState(initialData?.note || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0,10)); // Today's date
  const [walletSheetOpen, setWalletSheetOpen] = useState(false);
  
  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  
  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !walletId) return;
    if (type !== 'transfer' && !categoryId) return;

    await addTransaction({
      walletId,
      categoryId: type === 'transfer' ? 'transfer' : categoryId,
      amount: Number(amount),
      type,
      note,
      date: new Date(date).toISOString(),
    });
    onSuccess();
  };

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : settings.currency === 'EGP' ? 'ج.م ' : '¥';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-brand-dark" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Type Selector (Simplified header) */}
      <div className="flex bg-brand-darker border border-brand-light/30 p-1 rounded-xl mx-4 mt-4">
        {(['expense', 'income', 'transfer'] as const).map(t_val => (
          <button
            key={t_val}
            type="button"
            onClick={() => { setType(t_val); setCategoryId(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium capitalize transition-all text-sm ${
              type === t_val
                ? 'bg-brand-light/40 text-brand-teal shadow-sm'
                : 'text-brand-gray hover:text-neutral-300'
            }`}
          >
            {t_val === 'expense' ? <ArrowUpRight /> : t_val === 'income' ? <ArrowDownRight /> : <Swap />}
            {t(t_val)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Massive Amount Input */}
        <div className="space-y-2 bg-brand-darker border border-brand-light/30 p-4 rounded-3xl">
          <label className="block text-center text-sm font-medium text-brand-gray">{t('amount')}</label>
          <div className="flex items-center justify-center gap-2" style={{ direction: 'ltr' }}>
            <span className="text-3xl font-bold text-brand-teal">{currencySymbol}</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-brand-teal text-6xl font-extrabold w-48 text-center outline-none placeholder:text-brand-teal/20"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Category Horizontal Scroll (if not transfer) */}
        {type !== 'transfer' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-sm font-medium text-brand-gray">{t('category')}</label>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x no-scrollbar">
              {filteredCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`min-w-[80px] snap-start flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                    categoryId === c.id 
                      ? 'bg-brand-teal/20 border-brand-teal text-brand-teal' 
                      : 'bg-brand-darker border-brand-light/30 text-brand-gray hover:border-brand-teal/50'
                  }`}
                >
                  <div className="text-2xl"><CategoryIcon name={c.iconName} size={24} /></div>
                  <span className="text-xs font-medium truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account Selection */}
        <button 
          type="button"
          onClick={() => setWalletSheetOpen(true)}
          className="w-full bg-brand-darker border border-brand-light/30 rounded-2xl p-4 flex justify-between items-center active:scale-95 transition-all"
        >
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-brand-gray" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-brand-gray font-medium">{t('account')}</span>
              <span className="text-neutral-200 font-bold flex items-center gap-1.5">
                {wallets.find(w => w.id === walletId)?.type === 'cash' ? '💵 ' : '💳 '}
                {wallets.find(w => w.id === walletId)?.name || 'Select Account'}
              </span>
            </div>
          </div>
          <CaretRight size={20} className="text-brand-gray" />
        </button>

        {/* Date Selection */}
        <div className="bg-brand-darker border border-brand-light/30 rounded-2xl p-4">
          <label className="text-sm font-medium text-brand-gray mb-2 flex items-center gap-2">
            <CalendarBlank size={18} />
            {t('date')}
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-neutral-200 outline-none font-medium"
          />
        </div>

        {/* Note */}
        <div className="bg-brand-darker border border-brand-light/30 rounded-2xl p-4">
          <label className="text-sm font-medium text-brand-gray mb-2 flex items-center gap-2">
            <NotePencil size={18} />
            {t('note')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent text-neutral-200 outline-none placeholder:text-brand-gray/50"
            placeholder={t('whatWasThisFor')}
          />
        </div>

      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-brand-light/20 bg-brand-dark mt-auto pb-safe">
        <button
          type="submit"
          className="w-full bg-brand-teal hover:bg-[#4eb39b] text-brand-dark font-bold text-lg py-4 rounded-2xl transition-colors shadow-teal-glow flex justify-center items-center gap-2 active:scale-95"
        >
          <Check weight="bold" size={24} />
          {t('saveTransaction')}
        </button>
      </div>

      <ActionSheet
        isOpen={walletSheetOpen}
        onClose={() => setWalletSheetOpen(false)}
        title={t('account')}
        options={wallets.map(w => ({
          value: w.id,
          label: w.type === 'cash' ? `💵 ${w.name} (Cash)` : `💳 ${w.name}`
        }))}
        selectedValue={walletId}
        onSelect={(val) => setWalletId(val)}
        lang={lang}
      />
    </form>
  );
}

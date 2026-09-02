import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { Plus, Funnel, MagnifyingGlass, ArrowUpRight, ArrowDownRight, Swap } from '@phosphor-icons/react';

export function TransactionsView({ onAddTransaction }: { onAddTransaction: () => void }) {
  const { settings, transactions, categories, wallets } = useStore();

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : settings.currency === 'EGP' ? 'E£ ' : '¥';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">{t('transactions')}</h2>
          <p className="text-neutral-400">{t('searchTransactions')}</p>
        </div>
        <button 
          onClick={onAddTransaction}
          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={18} weight="bold" />
          <span className="hidden md:inline">{t('addTransaction')}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass className={`absolute top-1/2 -translate-y-1/2 text-neutral-500 ${lang === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
          <input 
            type="text" 
            placeholder={t('searchTransactions')} 
            className={`w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 ${lang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>
        <button className="flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 text-neutral-200 px-4 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors">
          <Funnel size={18} />
          {t('filter')}
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            {t('noTransactions')}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {transactions.map(tx => {
              const category = categories.find(c => c.id === tx.categoryId);
              const wallet = wallets.find(w => w.id === tx.walletId);
              const date = new Date(tx.date);
              
              return (
                <button key={tx.id} className="p-4 w-full flex items-center justify-between hover:bg-neutral-800/50 transition-colors active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income' ? 'bg-green-500/10 text-green-400' :
                      tx.type === 'expense' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowDownRight size={24} weight="duotone" /> :
                       tx.type === 'expense' ? <ArrowUpRight size={24} weight="duotone" /> :
                       <Swap size={24} weight="duotone" />}
                    </div>
                    <div className="text-left" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
                      <p className="font-medium text-neutral-200">{category?.name || 'Unknown'}</p>
                      <p className="text-sm text-neutral-500">{wallet?.name || 'Unknown'} • {date.toLocaleDateString()}</p>
                      {tx.note && <p className="text-xs text-neutral-400 mt-0.5">{tx.note}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0" style={{ direction: 'ltr' }}>
                    <p className={`font-medium font-mono ${
                      tx.type === 'income' ? 'text-green-400' :
                      tx.type === 'expense' ? 'text-neutral-200' :
                      'text-blue-400'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

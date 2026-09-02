import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { CaretLeft, CaretRight, Sparkle, Fire, CreditCard, ArrowRight, Microphone, ChatTeardropText, Check } from '@phosphor-icons/react';

interface DashboardViewProps {
  onNavigateToCards?: () => void;
  onOpenNewTx?: () => void;
  onOpenSmsImport?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DashboardView({ onNavigateToCards }: DashboardViewProps) {
  const { settings, wallets, transactions, categories, streak, selectedMonth, setSelectedMonth } = useStore();
  const [filterSource, setFilterSource] = useState<'all' | 'voice' | 'sms'>('all');

  const currencySymbol = settings?.currency || 'EGP';
  const monthlyBudget = settings?.monthlyBudget || 25000;

  // Month navigation
  const handlePrevMonth = () => {
    let newMonth = selectedMonth.month - 1;
    let newYear = selectedMonth.year;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setSelectedMonth(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newMonth = selectedMonth.month + 1;
    let newYear = selectedMonth.year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setSelectedMonth(newYear, newMonth);
  };

  // Filter transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const dt = new Date(t.date);
      return dt.getFullYear() === selectedMonth.year && dt.getMonth() === selectedMonth.month;
    });
  }, [transactions, selectedMonth]);

  // Total Spent & Income
  const { totalSpent, totalIncome } = useMemo(() => {
    let spent = 0;
    let income = 0;
    monthTransactions.forEach(t => {
      if (t.type === 'expense') spent += t.amount;
      else if (t.type === 'income') income += t.amount;
    });
    return { totalSpent: spent, totalIncome: income };
  }, [monthTransactions]);

  // Total Account Balance
  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }, [wallets]);

  // Budget calculations
  const budgetPercentage = Math.min(Math.round((totalSpent / monthlyBudget) * 100), 100);
  const isBudgetWarning = budgetPercentage >= 85;

  // Streak history check for 7 days
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Filtered transactions for feed
  const displayTransactions = useMemo(() => {
    if (filterSource === 'voice') return monthTransactions.filter(t => t.source === 'voice');
    if (filterSource === 'sms') return monthTransactions.filter(t => t.source === 'sms');
    return monthTransactions;
  }, [monthTransactions, filterSource]);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* 1. Month Selector Header (Say style) */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <CaretLeft size={16} weight="bold" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-extrabold text-white tracking-wide">
            {MONTH_NAMES[selectedMonth.month]} {selectedMonth.year}
          </h2>
          <p className="text-[11px] text-neutral-400 font-medium">Monthly Overview</p>
        </div>

        <button
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors active:scale-95"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* 2. Say Main Spent vs Income Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a7ea4]/25 via-neutral-900 to-neutral-900/90 border border-[#0a7ea4]/30 p-6 backdrop-blur-xl space-y-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0a7ea4]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Twin Spent / Income Grid */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">SPENT</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs font-bold text-[#0a7ea4]">{currencySymbol}</span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
                {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="border-l border-neutral-800/80 pl-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">INCOME</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xs font-bold text-emerald-400">{currencySymbol}</span>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-neutral-800/80 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">
              {currencySymbol} {Math.round(totalSpent).toLocaleString()} / {currencySymbol} {Math.round(monthlyBudget).toLocaleString()} budget
            </span>
            <span className={`font-mono font-bold ${isBudgetWarning ? 'text-amber-400' : 'text-[#0a7ea4]'}`}>
              {budgetPercentage}%
            </span>
          </div>

          <div className="h-2.5 w-full bg-neutral-950/60 rounded-full overflow-hidden p-0.5 border border-neutral-800/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetWarning
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf]'
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Habit Tracking Streak Pill (Say Feature) */}
      <div className="p-4 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Fire size={22} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{streak?.currentStreak || 5} Days Streak</span>
              <span className="text-xs text-amber-400 font-bold">🔥</span>
            </div>
            <p className="text-[11px] text-neutral-400">Daily expense tracking habit</p>
          </div>
        </div>

        {/* 7 Days check dots */}
        <div className="flex items-center gap-1">
          {weekDays.map((day, idx) => {
            const isCompleted = idx <= currentDayIndex;
            return (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCompleted
                    ? 'bg-[#0a7ea4] text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {isCompleted ? <Check size={10} weight="bold" /> : day}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. All Accounts / Cards Bar */}
      <button
        onClick={onNavigateToCards}
        className="w-full p-4 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 hover:border-[#0a7ea4]/50 flex items-center justify-between transition-all group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/20 flex items-center justify-center text-[#0a7ea4]">
            <CreditCard size={22} weight="duotone" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">All Accounts</span>
            <p className="text-sm font-bold text-white group-hover:text-[#0a7ea4] transition-colors">
              {wallets.length} Cards & Wallets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500">BALANCE</span>
            <p className="text-sm font-mono font-extrabold text-white">
              {currencySymbol} {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <ArrowRight size={16} className="text-neutral-500 group-hover:text-[#0a7ea4] transition-colors" />
        </div>
      </button>

      {/* 5. Recent Transactions Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Recent Transactions</span>
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterSource('all')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${
                filterSource === 'all'
                  ? 'bg-[#0a7ea4] text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSource('voice')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors ${
                filterSource === 'voice'
                  ? 'bg-[#0a7ea4] text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkle size={12} weight="fill" /> Voice
            </button>
            <button
              onClick={() => setFilterSource('sms')}
              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 transition-colors ${
                filterSource === 'sms'
                  ? 'bg-[#0a7ea4] text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <ChatTeardropText size={12} /> SMS
            </button>
          </div>
        </div>

        <div className="divide-y divide-neutral-800/80 bg-neutral-900/60 border border-neutral-800/80 rounded-3xl overflow-hidden">
          {displayTransactions.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 space-y-2">
              <Sparkle size={32} className="mx-auto text-neutral-600" />
              <p className="text-sm font-medium">No transactions found for this month</p>
              <p className="text-xs text-neutral-600">Tap the mic below or paste a bank SMS to log</p>
            </div>
          ) : (
            displayTransactions.slice(0, 10).map(tx => {
              const category = categories.find(c => c.id === tx.categoryId);
              const wallet = wallets.find(w => w.id === tx.walletId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between hover:bg-neutral-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-sm"
                      style={{ backgroundColor: `${category?.color || '#0a7ea4'}30`, color: category?.color || '#0a7ea4' }}
                    >
                      {tx.source === 'voice' ? (
                        <Microphone size={18} weight="fill" />
                      ) : tx.source === 'sms' ? (
                        <ChatTeardropText size={18} weight="fill" />
                      ) : (
                        <span className="text-xs font-bold">{category?.name?.charAt(0) || 'E'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white tracking-wide">
                          {tx.merchant || tx.note || category?.name || 'Transaction'}
                        </p>
                        {tx.source === 'voice' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0a7ea4]/20 text-[#0a7ea4] font-bold">
                            Voice
                          </span>
                        )}
                        {tx.source === 'sms' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold">
                            SMS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {category?.name} • {wallet?.name || 'Wallet'} • {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-mono font-extrabold ${isIncome ? 'text-emerald-400' : 'text-neutral-100'}`}>
                      {isIncome ? '+' : '-'} {currencySymbol} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

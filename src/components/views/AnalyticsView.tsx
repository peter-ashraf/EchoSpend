import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { Sparkle } from '@phosphor-icons/react';

const WEEK_BAR_COLORS = ['#F97316', '#3B82F6', '#A855F7', '#0a7ea4', '#10B981', '#F59E0B', '#EF4444'];

export function AnalyticsView() {
  const { transactions, categories, settings } = useStore();
  const currencySymbol = settings?.currency || 'EGP';

  // Weekly data (Monday to Sunday)
  const weeklyData = useMemo(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const now = new Date();
    
    // Get current week start (Monday)
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const amounts = [0, 0, 0, 0, 0, 0, 0];

    transactions.forEach(t => {
      if (t.type === 'expense') {
        const txDate = new Date(t.date);
        const diffDays = Math.floor((txDate.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          amounts[diffDays] += t.amount;
        }
      }
    });

    return days.map((day, idx) => ({
      day,
      amount: amounts[idx],
      color: WEEK_BAR_COLORS[idx]
    }));
  }, [transactions]);

  const thisWeekTotal = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + d.amount, 0);
  }, [weeklyData]);

  // Current Month Category Breakdown
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach(t => {
      const dt = new Date(t.date);
      if (t.type === 'expense' && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
        totalExpense += t.amount;
      }
    });

    return Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'General',
        color: cat?.color || '#0a7ea4',
        amount,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, currentMonth, currentYear]);

  // Top Merchants
  const topMerchants = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    transactions.forEach(t => {
      if (t.type === 'expense' && t.merchant) {
        const key = t.merchant.toUpperCase();
        if (!map[key]) map[key] = { total: 0, count: 0 };
        map[key].total += t.amount;
        map[key].count += 1;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Trends & Insights</h2>
        <p className="text-xs text-neutral-400 font-medium">Spending habits & weekly patterns</p>
      </div>

      {/* Weekly Spending Bar Chart Card (Say style) */}
      <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-xl">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">This Week's Spending</p>
            <p className="text-2xl font-extrabold font-mono text-white mt-0.5">
              {currencySymbol} {thisWeekTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#0a7ea4]/10 text-[#0a7ea4] font-bold border border-[#0a7ea4]/20 flex items-center gap-1">
            <Sparkle size={12} weight="fill" /> Weekly
          </span>
        </div>

        {/* Weekly Bars */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl shadow-xl text-xs">
                        <p className="text-neutral-400 font-medium">{data.day}</p>
                        <p className="text-sm font-bold text-white font-mono mt-0.5">
                          {currencySymbol} {Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[8, 8, 4, 4]}>
                {weeklyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.amount > 0 ? entry.color : '#262626'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category-by-Category Insights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Category Breakdown</span>
          <span className="text-xs text-neutral-500 font-medium">This Month</span>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 space-y-4">
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">No expenses logged this month</p>
          ) : (
            categoryBreakdown.map(cat => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-white">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-300">
                      {currencySymbol} {cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-neutral-500 font-semibold w-10 text-right">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Merchants */}
      {topMerchants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Top Places & Stores</span>
            <span className="text-xs text-neutral-500 font-medium">{topMerchants.length} merchants</span>
          </div>

          <div className="divide-y divide-neutral-800/80 bg-neutral-900/60 border border-neutral-800/80 rounded-3xl overflow-hidden">
            {topMerchants.map((m, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-bold text-[#0a7ea4]">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{m.name}</p>
                    <p className="text-xs text-neutral-500">{m.count} transactions</p>
                  </div>
                </div>
                <p className="text-sm font-mono font-bold text-white">
                  {currencySymbol} {m.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

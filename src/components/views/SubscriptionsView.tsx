import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import type { Subscription } from '../../lib/db';
import { SubscriptionModal } from '../modals/SubscriptionModal';
import { Plus, CalendarBlank } from '@phosphor-icons/react';

export function SubscriptionsView() {
  const { subscriptions, settings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const currencySymbol = settings?.currency || 'EGP';

  // Calculate stats
  const activeSubs = useMemo(() => subscriptions.filter(s => s.active), [subscriptions]);

  const monthlyTotal = useMemo(() => {
    return activeSubs.reduce((sum, s) => {
      if (s.billingCycle === 'yearly') {
        return sum + (s.amount / 12);
      }
      return sum + s.amount;
    }, 0);
  }, [activeSubs]);

  const yearlyTotal = monthlyTotal * 12;

  // Renewals this week & Coming Up
  const comingUp = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activeSubs.map(sub => {
      const nextDate = new Date(sub.nextBillingDate);
      nextDate.setHours(0, 0, 0, 0);
      const diffTime = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let label = '';
      if (diffDays === 0) label = 'Today';
      else if (diffDays === 1) label = 'Tomorrow';
      else if (diffDays > 1 && diffDays <= 7) label = `in ${diffDays}d`;
      else if (diffDays < 0) label = `${Math.abs(diffDays)}d overdue`;
      else label = `in ${diffDays}d`;

      return {
        ...sub,
        daysLeft: diffDays,
        dueLabel: label
      };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [activeSubs]);

  const thisWeekCount = useMemo(() => {
    return comingUp.filter(s => s.daysLeft >= 0 && s.daysLeft <= 7).length;
  }, [comingUp]);

  const handleEdit = (sub: Subscription) => {
    setSelectedSub(sub);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSub(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      
      {/* Top Bar with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Subscriptions</h2>
          <p className="text-xs text-neutral-400 font-medium">Recurring payments & renewals</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-xs font-bold transition-all shadow-lg shadow-[#0a7ea4]/20 active:scale-95"
        >
          <Plus size={16} weight="bold" />
          <span>Add</span>
        </button>
      </div>

      {/* Main Monthly Spending Hero Card (Say style) */}
      <div className="relative overflow-hidden rounded-3xl hero-card p-6 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0a7ea4]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">Monthly spending</p>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xs font-bold text-[#0a7ea4]">{currencySymbol}</span>
          <h3 className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
            {monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-800/80 text-center">
          <div className="p-2.5 rounded-2xl metric-pill border border-neutral-800/50">
            <p className="text-[11px] text-neutral-400 font-medium">Active</p>
            <p className="text-sm font-bold text-white mt-0.5">{activeSubs.length}</p>
          </div>
          <div className="p-2.5 rounded-2xl metric-pill border border-neutral-800/50">
            <p className="text-[11px] text-neutral-400 font-medium">Per year</p>
            <p className="text-xs font-bold text-[#0a7ea4] font-mono mt-0.5 truncate">
              {currencySymbol} {Math.round(yearlyTotal).toLocaleString()}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl metric-pill border border-neutral-800/50">
            <p className="text-[11px] text-neutral-400 font-medium">This week</p>
            <p className="text-sm font-bold text-amber-400 mt-0.5">{thisWeekCount}</p>
          </div>
        </div>
      </div>

      {/* COMING UP Section */}
      {comingUp.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Coming Up</span>
            <span className="text-xs text-neutral-500 font-medium">Next renewals</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {comingUp.slice(0, 5).map(sub => (
              <button
                key={sub.id}
                onClick={() => handleEdit(sub)}
                className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-[#0a7ea4]/50 transition-all active:scale-95 text-left"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                  style={{ backgroundColor: sub.brandColor || '#0a7ea4' }}
                >
                  {sub.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[100px]">{sub.name}</p>
                  <p className={`text-[11px] font-semibold ${
                    sub.daysLeft <= 1 ? 'text-amber-400' : 'text-neutral-400'
                  }`}>
                    {sub.dueLabel}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Your Subscriptions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Your Subscriptions</span>
          <span className="text-xs text-neutral-500">{activeSubs.length} services</span>
        </div>

        <div className="divide-y divide-neutral-800/80 bg-neutral-900/60 border border-neutral-800/80 rounded-3xl overflow-hidden">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 space-y-2">
              <CalendarBlank size={32} className="mx-auto text-neutral-600" />
              <p className="text-sm font-medium">No recurring subscriptions yet</p>
              <button
                onClick={handleAdd}
                className="text-xs text-[#0a7ea4] font-bold hover:underline"
              >
                + Add your first subscription
              </button>
            </div>
          ) : (
            subscriptions.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleEdit(sub)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/40 transition-colors text-left group active:bg-neutral-800/60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shadow-md"
                    style={{ backgroundColor: sub.brandColor || '#0a7ea4' }}
                  >
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white group-hover:text-[#0a7ea4] transition-colors">
                        {sub.name}
                      </p>
                      {!sub.active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 capitalize">
                      {sub.billingCycle} • Next: {new Date(sub.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-white">
                    {currencySymbol} {sub.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-neutral-400 capitalize">/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscription={selectedSub}
      />
    </div>
  );
}

import { useStore } from '../../store/useStore';
import { House, CalendarBlank, CreditCard, ChartBar, Plus, ChatTeardropText, Gear } from '@phosphor-icons/react';
import { useEffect } from 'react';

export type NavTab = 'dashboard' | 'subscriptions' | 'cards' | 'analytics' | 'settings';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onAddTransaction?: () => void;
  onOpenSmsImport?: () => void;
}

export function AppLayout({ children, activeTab, onTabChange, onAddTransaction, onOpenSmsImport }: AppLayoutProps) {
  const { settings } = useStore();
  const lang = settings?.language || 'en';

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-50 flex flex-col ${lang === 'ar' ? 'font-arabic' : 'font-sans'}`}>
      
      {/* Top Header (Say Brand) */}
      <header className="flex items-center justify-between px-5 py-4 bg-neutral-950/80 backdrop-blur-xl sticky top-0 z-30 border-b border-neutral-800/60 max-w-lg mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0a7ea4] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#0a7ea4]/30">
            S
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">Say</h1>
            <p className="text-[10px] text-neutral-400 font-medium">Hands-free budget</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenSmsImport && (
            <button
              onClick={onOpenSmsImport}
              title="Auto-import Bank SMS"
              className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-[#0a7ea4] hover:border-[#0a7ea4]/40 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
            >
              <ChatTeardropText size={14} />
              <span>SMS</span>
            </button>
          )}

          {onAddTransaction && (
            <button 
              onClick={onAddTransaction}
              title="Add Manual Transaction"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-white hover:border-[#0a7ea4] hover:text-[#0a7ea4] active:scale-95 transition-all"
            >
              <Plus size={16} weight="bold" />
            </button>
          )}

          <button 
            onClick={() => onTabChange('settings')}
            title="Settings"
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              activeTab === 'settings' ? 'bg-[#0a7ea4] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Gear size={18} weight={activeTab === 'settings' ? 'fill' : 'regular'} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto px-4 pt-4 pb-32 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Say iOS-Style Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-950/90 backdrop-blur-2xl border-t border-neutral-800/80 pb-safe z-30">
        <div className="flex justify-between items-center px-4 h-20 max-w-lg mx-auto relative w-full">
          
          {/* 1. Home / Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2 ${
              activeTab === 'dashboard' ? 'text-[#0a7ea4]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <House size={24} weight={activeTab === 'dashboard' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* 2. Subscriptions */}
          <button
            onClick={() => onTabChange('subscriptions')}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2 ${
              activeTab === 'subscriptions' ? 'text-[#0a7ea4]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CalendarBlank size={24} weight={activeTab === 'subscriptions' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold">Subs</span>
          </button>

          {/* Spacer for Center Voice Button */}
          <div className="w-16" aria-hidden="true" />

          {/* 3. Cards / Accounts */}
          <button
            onClick={() => onTabChange('cards')}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2 ${
              activeTab === 'cards' ? 'text-[#0a7ea4]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CreditCard size={24} weight={activeTab === 'cards' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold">Cards</span>
          </button>

          {/* 4. Trends / Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex flex-col items-center gap-1 transition-all py-1 px-2 ${
              activeTab === 'analytics' ? 'text-[#0a7ea4]' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <ChartBar size={24} weight={activeTab === 'analytics' ? 'fill' : 'regular'} />
            <span className="text-[10px] font-bold">Trends</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

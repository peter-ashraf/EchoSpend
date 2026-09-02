import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';
import { AppLayout, type NavTab } from './components/layout/AppLayout';
import { DashboardView } from './components/views/DashboardView';
import { SubscriptionsView } from './components/views/SubscriptionsView';
import { CardsView } from './components/views/CardsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { Modal } from './components/ui/Modal';
import { TransactionForm } from './components/forms/TransactionForm';
import { SmsImportModal } from './components/modals/SmsImportModal';
import { VoiceMicButton } from './components/ui/VoiceMicButton';
import { parseVoiceInput } from './lib/parseVoice';

function App() {
  const { initData, isLoading, settings, categories, wallets } = useStore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [initialTxData, setInitialTxData] = useState<any>(undefined);

  useEffect(() => {
    initData();
  }, [initData]);

  // Apply theme class to html element
  useEffect(() => {
    if (!settings) return;
    const isDark = 
      settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.theme]);

  const handleVoiceTranscript = (text: string) => {
    const defaultWalletId = wallets[0]?.id || '';
    const parsedData = parseVoiceInput(text, categories, wallets, defaultWalletId);
    setInitialTxData(parsedData);
    setIsTxModalOpen(true);
  };

  const openNewTx = () => {
    setInitialTxData(undefined);
    setIsTxModalOpen(true);
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0a7ea4] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#0a7ea4]/30 animate-pulse">
          S
        </div>
        <div className="w-8 h-8 border-3 border-[#0a7ea4]/30 border-t-[#0a7ea4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AppLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddTransaction={openNewTx}
        onOpenSmsImport={() => setIsSmsModalOpen(true)}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <DashboardView 
                onNavigateToCards={() => setActiveTab('cards')} 
                onOpenNewTx={openNewTx}
                onOpenSmsImport={() => setIsSmsModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'subscriptions' && (
            <motion.div key="subscriptions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SubscriptionsView />
            </motion.div>
          )}

          {activeTab === 'cards' && (
            <motion.div key="cards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <CardsView />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <AnalyticsView />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </AppLayout>

      {/* Floating Center Voice Button (Say Signature Mic) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
        <VoiceMicButton onTranscript={handleVoiceTranscript} />
      </div>

      {/* Manual / Voice Transaction Form Modal */}
      <Modal 
        isOpen={isTxModalOpen} 
        onClose={() => setIsTxModalOpen(false)}
        title={initialTxData ? "Confirm Voice Entry" : "Add Transaction"}
      >
        <TransactionForm 
          key={initialTxData ? JSON.stringify(initialTxData) : 'new'}
          onSuccess={() => setIsTxModalOpen(false)} 
          initialData={initialTxData} 
        />
      </Modal>

      {/* Bank SMS Auto-Import Modal */}
      <SmsImportModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        onSuccess={() => setActiveTab('dashboard')}
      />
    </>
  );
}

export default App;

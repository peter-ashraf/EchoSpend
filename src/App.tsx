import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { VoiceConfirmModal } from './components/modals/VoiceConfirmModal';
import { VoiceMicButton } from './components/ui/VoiceMicButton';
import { BiometricLockScreen } from './components/modals/BiometricLockScreen';
import { OfflineVoiceConsentModal } from './components/modals/OfflineVoiceConsentModal';
import { parseVoiceInput, type ParsedVoiceTransaction } from './lib/parseVoice';
import { parseBankSms, type ParsedSmsResult } from './lib/parseSms';
import { downloadWhisperModel, transcribeBlob, terminateWhisper, ensureWhisperReady } from './lib/whisperOffline';
import { APP_VERSION, onUpdateAvailable, reloadAndApplyUpdate } from './lib/pwaUpdate';
import { UpdatePromptModal } from './components/modals/UpdatePromptModal';
import { Keyboard, WifiSlash, CloudArrowDown, Check, CheckCircle, X } from '@phosphor-icons/react';

function App() {
  const { initData, isLoading, settings, categories, wallets, setOfflineVoiceStatus, addTransaction } = useStore();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isManualTxOpen, setIsManualTxOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [voiceParsedData, setVoiceParsedData] = useState<ParsedVoiceTransaction | null>(null);

  // ── Keyboard modal (root-level portal to avoid transform clipping) ──
  const [showKeyboardModal, setShowKeyboardModal] = useState(false);
  const [keyboardText, setKeyboardText] = useState('');
  const [isOfflineForKeyboard, setIsOfflineForKeyboard] = useState(false);

  // ── Biometric lock ──
  const [isLocked, setIsLocked] = useState(false);

  // ── Offline voice / Whisper ──
  const [showOfflineConsent, setShowOfflineConsent] = useState(false);
  const [whisperStatus, setWhisperStatus] = useState<'idle' | 'downloading' | 'ready' | 'transcribing'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('');
  const whisperReadyRef = useRef(false);

  // ── Clipboard Auto-Detected SMS ──
  const [detectedSms, setDetectedSms] = useState<ParsedSmsResult | null>(null);
  const [importSuccessToast, setImportSuccessToast] = useState<string | null>(null);
  const lastDismissedSmsText = useRef<string>('');
  const [isGlobalUpdateAvailable, setIsGlobalUpdateAvailable] = useState(false);

  // ── PWA Update Event Listener ────────────────────────────────────────
  useEffect(() => {
    onUpdateAvailable((hasUpdate) => {
      if (hasUpdate) setIsGlobalUpdateAvailable(true);
    });
    const handleNeedRefresh = () => setIsGlobalUpdateAvailable(true);
    window.addEventListener('pwa-need-refresh', handleNeedRefresh);
    return () => window.removeEventListener('pwa-need-refresh', handleNeedRefresh);
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    initData();
  }, [initData]);

  // ── Biometric: lock on every app open ────────────────────────────────
  useEffect(() => {
    if (!settings) return;
    if (settings.biometricLock && settings.biometricCredentialId) {
      setIsLocked(true);
    }
  }, [settings?.biometricLock, settings?.biometricCredentialId]);

  // ── Theme ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!settings) return;
    const applyTheme = (theme: string) => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };
    applyTheme(settings.theme || 'dark');
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [settings?.theme]);

  // ── Offline voice package pre-warming from browser cache ──────────────
  useEffect(() => {
    if (settings && settings.offlineVoiceStatus === 'not-asked') {
      setShowOfflineConsent(true);
    } else if (settings?.offlineVoiceStatus === 'ready') {
      setWhisperStatus('ready');
      whisperReadyRef.current = true;
      // Pre-warm the Web Worker in the background so it is instantly ready offline
      ensureWhisperReady().catch(console.warn);
    }
  }, [settings?.offlineVoiceStatus]);

  // ── Automatic Clipboard SMS Detection ─────────────────────────────────
  const checkClipboardForSms = useCallback(async () => {
    if (!navigator.clipboard?.readText) return;
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || clipText.trim().length < 10) return;
      if (clipText.trim() === lastDismissedSmsText.current) return;

      const lower = clipText.toLowerCase();
      const hasBankKeywords =
        lower.includes('egp') || lower.includes('usd') || lower.includes('le') ||
        lower.includes('ج.م') || lower.includes('جنيه') || lower.includes('purchase') ||
        lower.includes('شراء') || lower.includes('card') || lower.includes('بطاقة') ||
        lower.includes('instapay') || lower.includes('credited') || lower.includes('إيداع') ||
        lower.includes('cib') || lower.includes('nbe') || lower.includes('bank') ||
        lower.includes('ahli') || lower.includes('misr') || lower.includes('qnb');

      if (!hasBankKeywords) return;

      const defaultWalletId = wallets[0]?.id || '';
      const parsed = parseBankSms(clipText, categories, wallets, defaultWalletId);
      if (parsed && parsed.amount > 0) {
        setDetectedSms(parsed);
      }
    } catch (_) {
      // Ignore clipboard permission rejections silently
    }
  }, [categories, wallets]);

  useEffect(() => {
    // Check clipboard when user returns to or focuses the app
    const onFocus = () => checkClipboardForSms();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkClipboardForSms();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkClipboardForSms]);

  // ── Voice transcript handler ──────────────────────────────────────────
  const handleVoiceTranscript = useCallback((text: string) => {
    const defaultWalletId = wallets[0]?.id || '';
    const parsedData = parseVoiceInput(text, categories, wallets, defaultWalletId);
    setVoiceParsedData(parsedData);
  }, [categories, wallets]);

  const openNewTx = () => setIsManualTxOpen(true);

  const handleKeyboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyboardText.trim()) {
      setShowKeyboardModal(false);
      handleVoiceTranscript(keyboardText.trim());
      setKeyboardText('');
    }
  };

  const openKeyboardModal = (offline = false) => {
    setIsOfflineForKeyboard(offline);
    setShowKeyboardModal(true);
  };

  // ── Whisper download flow ─────────────────────────────────────────────
  const startWhisperDownload = useCallback(() => {
    setShowOfflineConsent(false);
    setWhisperStatus('downloading');
    setDownloadProgress(0);

    downloadWhisperModel({
      onProgress: (progress, status) => {
        setDownloadProgress(progress);
        setDownloadStatusText(status);
      },
      onReady: () => {
        setWhisperStatus('ready');
        whisperReadyRef.current = true;
        setOfflineVoiceStatus('ready');
      },
      onError: (msg) => {
        console.error('Whisper load error:', msg);
        setWhisperStatus('idle');
        setOfflineVoiceStatus('not-asked');
      },
    });
  }, [setOfflineVoiceStatus]);

  // ── Called when mic is pressed while offline ──────────────────────────
  const handleOfflineMicPress = useCallback((blob: Blob) => {
    setWhisperStatus('transcribing');
    transcribeBlob({
      blob,
      language: settings?.voiceLanguage || 'ar-EG',
      onResult: (text) => {
        setWhisperStatus('ready');
        handleVoiceTranscript(text);
      },
      onError: (msg) => {
        console.error('Transcription error:', msg);
        setWhisperStatus('ready');
      },
    });
  }, [settings?.voiceLanguage, handleVoiceTranscript]);

  // ── Cleanup Whisper worker on unmount ─────────────────────────────────
  useEffect(() => () => terminateWhisper(), []);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-3xl overflow-hidden shadow-xl shadow-[#0a7ea4]/30 animate-pulse border border-neutral-800">
          <img src="./apple-touch-icon.png" alt="EchoSpend" className="w-full h-full object-cover" />
        </div>
        <div className="w-8 h-8 border-3 border-[#0a7ea4]/30 border-t-[#0a7ea4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* ── Biometric Lock Screen ───────────────────────────────── */}
      {isLocked && (
        <BiometricLockScreen onUnlocked={() => setIsLocked(false)} />
      )}

      {/* ── Clipboard Auto-Detected SMS Floating Banner ─────────── */}
      <AnimatePresence>
        {detectedSms && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-auto"
          >
            <div className="bg-neutral-900/95 border border-[#0a7ea4]/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-[#0a7ea4]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0a7ea4] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0a7ea4]"></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0a7ea4]">
                    Detected Bank SMS
                  </span>
                </div>
                <button
                  onClick={() => {
                    lastDismissedSmsText.current = detectedSms.rawText;
                    setDetectedSms(null);
                  }}
                  className="text-neutral-400 hover:text-white text-xs p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-neutral-400">Merchant</p>
                  <p className="text-sm font-bold text-white">{detectedSms.merchant || 'Bank Transaction'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-400">Amount</p>
                  <p className="text-base font-mono font-extrabold text-[#0a7ea4]">
                    {settings.currency || 'EGP'} {detectedSms.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    lastDismissedSmsText.current = detectedSms.rawText;
                    setDetectedSms(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold"
                >
                  Ignore
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await addTransaction({
                      amount: detectedSms.amount,
                      walletId: detectedSms.walletId,
                      categoryId: detectedSms.categoryId,
                      type: detectedSms.type,
                      merchant: detectedSms.merchant,
                      note: detectedSms.note,
                      date: detectedSms.date,
                      source: 'sms'
                    });
                    lastDismissedSmsText.current = detectedSms.rawText;
                    setDetectedSms(null);
                    setImportSuccessToast(`Logged ${settings.currency || 'EGP'} ${detectedSms.amount} at ${detectedSms.merchant}!`);
                    setTimeout(() => setImportSuccessToast(null), 3500);
                  }}
                  className="flex-[1.5] py-2 rounded-xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 text-xs font-bold shadow-md shadow-[#0a7ea4]/20 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} weight="bold" />
                  Import Expense
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Success Toast ───────────────────────────────────────── */}
      <AnimatePresence>
        {importSuccessToast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl"
          >
            <CheckCircle size={16} className="text-emerald-400" weight="fill" />
            <span className="text-xs font-bold text-emerald-300">{importSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── App Shell (visible under lock screen blur) ──────────── */}
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
              <SettingsView
                onStartWhisperDownload={startWhisperDownload}
                whisperDownloadProgress={downloadProgress}
                whisperDownloadStatus={downloadStatusText}
                isWhisperDownloading={whisperStatus === 'downloading'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AppLayout>

      {/* ── Floating Voice Button ───────────────────────────────── */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <VoiceMicButton
          onTranscript={handleVoiceTranscript}
          onRequestKeyboard={openKeyboardModal}
          onRequestOfflineConsent={() => setShowOfflineConsent(true)}
          onOfflineAudioReady={handleOfflineMicPress}
          offlineVoiceStatus={settings.offlineVoiceStatus}
          isWhisperTranscribing={whisperStatus === 'transcribing'}
        />
      </div>

      {/* ── Manual Transaction Modal ────────────────────────────── */}
      <Modal isOpen={isManualTxOpen} onClose={() => setIsManualTxOpen(false)} title="Add Transaction">
        <TransactionForm key="manual-tx" onSuccess={() => setIsManualTxOpen(false)} />
      </Modal>

      {/* ── Voice Confirm Modal ─────────────────────────────────── */}
      <VoiceConfirmModal
        isOpen={!!voiceParsedData}
        onClose={() => setVoiceParsedData(null)}
        data={voiceParsedData}
        onConfirm={() => {
          setVoiceParsedData(null);
          setActiveTab('dashboard');
        }}
      />

      {/* ── SMS Import Modal ────────────────────────────────────── */}
      <SmsImportModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        onSuccess={() => setActiveTab('dashboard')}
      />

      {/* ── Offline Voice Consent Modal ─────────────────────────── */}
      <OfflineVoiceConsentModal
        isOpen={showOfflineConsent}
        onAgree={startWhisperDownload}
        onDecline={() => {
          setShowOfflineConsent(false);
          setOfflineVoiceStatus('declined');
          openKeyboardModal(true);
        }}
      />

      {/* ── Whisper Download Progress Overlay ──────────────────── */}
      {whisperStatus === 'downloading' && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9990] flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0a7ea4]/15 border border-[#0a7ea4]/30 flex items-center justify-center">
                <CloudArrowDown size={22} className="text-[#0a7ea4]" weight="duotone" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Downloading Voice Model</h3>
                <p className="text-neutral-400 text-xs">{downloadStatusText || 'Initializing...'}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] rounded-full"
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-xs">Whisper-tiny (~40 MB)</span>
                <span className="text-white font-mono font-bold text-xs">{downloadProgress}%</span>
              </div>
            </div>

            <p className="text-neutral-600 text-[11px] text-center">
              This is a one-time download. Please keep the app open.
            </p>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* ── Keyboard Entry Modal ────────────────────────────────── */}
      {showKeyboardModal && createPortal(
        <AnimatePresence>
          <motion.div
            key="keyboard-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowKeyboardModal(false); setKeyboardText(''); } }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Keyboard size={18} className="text-[#0a7ea4]" />
                  Type Your Expense
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowKeyboardModal(false); setKeyboardText(''); }}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white text-xs font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {isOfflineForKeyboard && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <WifiSlash size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] text-amber-300 font-medium">
                    You're offline — type your expense below instead.
                  </p>
                </div>
              )}

              <form onSubmit={handleKeyboardSubmit} className="space-y-3">
                <input
                  type="text"
                  autoFocus
                  value={keyboardText}
                  onChange={(e) => setKeyboardText(e.target.value)}
                  placeholder={
                    settings?.voiceLanguage === 'ar-EG'
                      ? 'مثال: ستاربكس 140 جنيه أو غداء 200'
                      : 'e.g. Starbucks $5 or Groceries 200'
                  }
                  className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#0a7ea4] focus:ring-1 focus:ring-[#0a7ea4]/30 transition-colors"
                />
                <p className="text-[10px] text-neutral-500 text-center">
                  Describe your expense naturally — amount + item + place
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowKeyboardModal(false); setKeyboardText(''); }}
                    className="flex-1 py-3 rounded-2xl border border-neutral-800 text-neutral-300 text-sm font-semibold hover:border-neutral-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!keyboardText.trim()}
                    className="flex-1 py-3 rounded-2xl bg-[#0a7ea4] hover:bg-[#086F8A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-[#0a7ea4]/25 transition-colors"
                  >
                    Parse & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* ── Global PWA Update Modal ────────────────────────────── */}
      <UpdatePromptModal
        isOpen={isGlobalUpdateAvailable}
        onClose={() => setIsGlobalUpdateAvailable(false)}
        onUpdate={reloadAndApplyUpdate}
        currentVersion={APP_VERSION}
      />
    </>
  );
}

export default App;

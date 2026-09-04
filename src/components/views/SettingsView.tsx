import { useStore, type BackupStats } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { Waveform, Moon, Sun, CaretRight, Translate, UserCircle, Trash, Warning, CurrencyDollar, Desktop, WifiSlash, CloudArrowDown, Fingerprint, Check, Lock, X, ArrowsClockwise, RocketLaunch, Sparkle, EyeSlash, DownloadSimple, UploadSimple, ShieldCheck } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ActionSheet } from '../ui/ActionSheet';
import { Modal } from '../ui/Modal';
import { CategoryForm } from '../forms/CategoryForm';
import type { Category } from '../../store/useStore';
import { Plus } from '@phosphor-icons/react';
import { isBiometricSupported, registerBiometric, clearBiometricCredential } from '../../lib/biometricAuth';
import { APP_VERSION, BUILD_TIME, GIT_HASH, checkForAppUpdate, reloadAndApplyUpdate } from '../../lib/pwaUpdate';
import { UpdatePromptModal } from '../modals/UpdatePromptModal';

interface SettingsViewProps {
  onStartWhisperDownload?: () => void;
  whisperDownloadProgress?: number;
  whisperDownloadStatus?: string;
  isWhisperDownloading?: boolean;
}

export function SettingsView({ onStartWhisperDownload, isWhisperDownloading }: SettingsViewProps) {
  const { settings, categories, updateSettings, initData, removeWhisperCache, exportData, inspectBackupData, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [importToast, setImportToast] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isConfirmImportOpen, setIsConfirmImportOpen] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<{ rawJson: string; stats?: BackupStats; isEncrypted: boolean } | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [voiceLangSheetOpen, setVoiceLangSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [isRemoveWhisperModalOpen, setIsRemoveWhisperModalOpen] = useState(false);

  // PWA App Version & Update State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [checkResultText, setCheckResultText] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setCheckResultText('Querying server for latest build...');
    const result = await checkForAppUpdate();
    setIsCheckingUpdate(false);
    setCheckResultText(result.statusText);
    setHasNewUpdate(result.hasUpdate);
    if (result.hasUpdate) {
      setIsUpdateModalOpen(true);
    }
  };

  // Check biometric support on mount
  useEffect(() => {
    isBiometricSupported().then(setBiometricSupported);
  }, []);

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  const currencySymbol = settings.currency || 'EGP';

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudget);
    await updateSettings({ monthlyBudget: !isNaN(val) && val >= 0 ? val : 0 });
    setIsBudgetModalOpen(false);
  };

  const handleResetAllData = async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases?.() || [];
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
    await initData();
    setIsResetModalOpen(false);
    window.location.reload();
  };

  const handleBiometricToggle = async () => {
    if (!biometricSupported) return;
    setBiometricLoading(true);
    setBiometricError(null);
    try {
      if (settings?.biometricLock) {
        // Disable
        clearBiometricCredential();
        await updateSettings({ biometricLock: false, biometricCredentialId: undefined });
      } else {
        // Enable
        const credentialId = await registerBiometric();
        await updateSettings({ biometricLock: true, biometricCredentialId: credentialId });
      }
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Setup cancelled — try again.'
        : err?.message || 'Biometric setup failed.';
      setBiometricError(msg);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setExportToast(null);
      const jsonString = await exportData();
      const isEncrypted = settings?.encryptBackups;
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `echospend-backup-${dateStr}${isEncrypted ? '-encrypted' : ''}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportToast(`Downloaded "${fileName}"`);
      setTimeout(() => setExportToast(null), 4000);
    } catch (err: any) {
      setExportToast(`Export failed: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setExportToast(null), 4000);
    } finally {
      setExportLoading(false);
    }
  };

  const handleTriggerImport = () => {
    setImportError(null);
    setImportToast(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const inspection = await inspectBackupData(content);
      if (inspection.needsPassword) {
        setPendingBackup({ rawJson: content, isEncrypted: true });
        setDecryptPassword('');
        setPasswordError(null);
        setPasswordModalOpen(true);
      } else if (!inspection.valid) {
        setImportError(inspection.error || 'Invalid backup file format.');
        setTimeout(() => setImportError(null), 5000);
      } else {
        setPendingBackup({ rawJson: content, stats: inspection.stats, isEncrypted: inspection.isEncrypted });
        setIsConfirmImportOpen(true);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBackup?.rawJson) return;

    setIsDecrypting(true);
    setPasswordError(null);
    const inspection = await inspectBackupData(pendingBackup.rawJson, decryptPassword);
    setIsDecrypting(false);

    if (!inspection.valid) {
      setPasswordError(inspection.error || 'Incorrect password.');
      return;
    }

    setPasswordModalOpen(false);
    setPendingBackup({ rawJson: pendingBackup.rawJson, stats: inspection.stats, isEncrypted: true });
    setIsConfirmImportOpen(true);
  };

  const handleExecuteRestore = async () => {
    if (!pendingBackup?.rawJson) return;

    setIsRestoring(true);
    const res = await importData(pendingBackup.rawJson, decryptPassword || undefined);
    setIsRestoring(false);
    setIsConfirmImportOpen(false);
    setPendingBackup(null);
    setDecryptPassword('');

    if (res.success) {
      const txCount = res.stats?.transactionsCount ?? 0;
      const wCount = res.stats?.walletsCount ?? 0;
      const cCount = res.stats?.categoriesCount ?? 0;
      setImportToast(`Restored: ${txCount} transactions, ${wCount} accounts, ${cCount} categories.`);
      setTimeout(() => setImportToast(null), 5000);
    } else {
      setImportError(`Failed to restore backup: ${res.error}`);
      setTimeout(() => setImportError(null), 5000);
    }
  };

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Settings</h2>
        <p className="text-xs text-neutral-400 font-medium">Preferences & data management</p>
      </div>

      {/* User Profile Card */}
      <div className="p-5 rounded-3xl theme-surface border border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0a7ea4]/15 border border-[#0a7ea4]/25 flex items-center justify-center text-[#0a7ea4] font-bold text-lg">
            <UserCircle size={32} weight="duotone" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Personal Account</h3>
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Local Device Encrypted
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full metric-pill text-neutral-300 font-semibold border border-neutral-700/60">
          Offline PWA
        </span>
      </div>

      {/* Section 1: Monthly Budget & Categories */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">Budget & Limits</span>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 divide-y divide-neutral-800/80">
          
          {/* Monthly Budget Setting */}
          <button 
            type="button"
            onClick={() => {
              setNewBudget(settings.monthlyBudget && settings.monthlyBudget > 0 ? settings.monthlyBudget.toString() : '');
              setIsBudgetModalOpen(true);
            }}
            className="pb-4 flex justify-between items-center w-full active:scale-[0.99] transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 text-white font-semibold text-sm">
              <div className="p-2 rounded-xl bg-[#0a7ea4]/10 text-[#0a7ea4]">
                <CurrencyDollar size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Monthly Target Budget</p>
                <p className="text-xs text-neutral-400">Total spending limit per month</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-bold text-sm">
                {settings.monthlyBudget && settings.monthlyBudget > 0 
                  ? `${currencySymbol} ${settings.monthlyBudget.toLocaleString()}` 
                  : 'Not Set'}
              </span>
              <CaretRight size={16} className="text-neutral-500" />
            </div>
          </button>

          {/* Categories Grid */}
          <div className="pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Expense Categories</h4>
              <button
                onClick={() => {
                  setEditingCategory(undefined);
                  setIsCategoryModalOpen(true);
                }}
                className="text-xs font-bold text-[#0a7ea4] flex items-center gap-1 hover:underline"
              >
                <Plus size={14} weight="bold" /> Add
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {categories.map(c => (
                <button 
                  key={c.id} 
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      navigator.vibrate(12);
                    }
                    setEditingCategory(c);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col items-center gap-1.5 active:scale-90 active:ring-2 active:ring-[#0a7ea4] active:bg-[#0a7ea4]/10 transition-all cursor-pointer hover:border-[#0a7ea4]/40 hover:scale-[1.02] shadow-sm select-none"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm transition-transform"
                    style={{ backgroundColor: `${c.color}25`, color: c.color }}
                  >
                    <CategoryIcon name={c.iconName} size={20} />
                  </div>
                  <span className="text-[10px] text-neutral-300 font-semibold truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: App Preferences */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">App Setup</span>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 divide-y divide-neutral-800/80">
          
          {/* Voice Language Calibration */}
          <button 
            onClick={() => setVoiceLangSheetOpen(true)}
            className="py-3.5 first:pt-0 flex justify-between items-center w-full active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium text-sm">
              <Waveform size={20} className="text-[#0a7ea4]" />
              <span>Voice Speech Recognition</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs font-bold">{settings.voiceLanguage === 'ar-EG' ? 'عربي (مصر)' : 'English (US)'}</span>
              <CaretRight size={16} className="text-neutral-500" />
            </div>
          </button>

          {/* App Language */}
          <button 
            onClick={() => setLangSheetOpen(true)}
            className="py-3.5 flex justify-between items-center w-full active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium text-sm">
              <Translate size={20} className="text-[#0a7ea4]" />
              <span>Interface Language</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs font-bold">{settings.language === 'ar' ? 'العربية' : 'English'}</span>
              <CaretRight size={16} className="text-neutral-500" />
            </div>
          </button>

          {/* Currency */}
          <button 
            onClick={() => setCurrencySheetOpen(true)}
            className="py-3.5 flex justify-between items-center w-full active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium text-sm">
              <span className="text-base font-bold text-[#0a7ea4]">$</span>
              <span>Currency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs font-bold">{settings.currency}</span>
              <CaretRight size={16} className="text-neutral-500" />
            </div>
          </button>

          {/* Theme Selector: Light / System / Dark */}
          <div className="py-3.5 flex justify-between items-center w-full">
            <div className="flex items-center gap-3 text-white font-medium text-sm">
              {settings.theme === 'dark'
                ? <Moon size={20} className="text-[#0a7ea4]" />
                : settings.theme === 'light'
                ? <Sun size={20} className="text-[#0a7ea4]" />
                : <Desktop size={20} className="text-[#0a7ea4]" />}
              <div>
                <p className="text-sm font-bold text-white">Appearance</p>
                <p className="text-xs text-neutral-400">
                  {settings.theme === 'system'
                    ? `System (${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'})`
                    : settings.theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-neutral-950/70 rounded-xl p-1 border border-neutral-800">
              {(['light', 'system', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    settings.theme === t
                      ? 'bg-[#0a7ea4] text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {t === 'light' ? <Sun size={13} weight={settings.theme === t ? 'fill' : 'regular'} /> : null}
                  {t === 'system' ? <Desktop size={13} weight={settings.theme === t ? 'fill' : 'regular'} /> : null}
                  {t === 'dark' ? <Moon size={13} weight={settings.theme === t ? 'fill' : 'regular'} /> : null}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Section 3: Offline Voice Package */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">Offline Voice</span>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#0a7ea4]/10 text-[#0a7ea4] flex-shrink-0">
              <WifiSlash size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Offline Voice Package</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {settings.offlineVoiceStatus === 'ready'
                  ? 'Whisper AI model is downloaded. Mic works offline.'
                  : settings.offlineVoiceStatus === 'declined'
                  ? 'Download declined — voice requires internet.'
                  : 'Not downloaded — voice requires internet.'}
              </p>
            </div>
            {settings.offlineVoiceStatus === 'ready' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Check size={13} className="text-emerald-400" weight="bold" />
              </div>
            )}
          </div>

          {isWhisperDownloading && (
            <div className="space-y-1.5">
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-neutral-400 text-center">Downloading model...</p>
            </div>
          )}

          {settings.offlineVoiceStatus !== 'ready' && !isWhisperDownloading && (
            <button
              onClick={onStartWhisperDownload}
              className="w-full py-3 px-4 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 text-[#0a7ea4] hover:bg-[#0a7ea4]/20 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
            >
              <CloudArrowDown size={16} weight="bold" />
              Download Offline Package (~40 MB)
            </button>
          )}

          {settings.offlineVoiceStatus === 'ready' && (
            <button
              onClick={() => setIsRemoveWhisperModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
            >
              <X size={14} weight="bold" />
              Remove Offline Package
            </button>
          )}
        </div>
      </div>

      {/* Section 4: Security & Privacy */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">Security & Privacy</span>
        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 space-y-4">
          
          {/* 1. Thndr-Style Privacy Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <EyeSlash size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Thndr-Style Privacy Mode</p>
                <p className="text-xs text-neutral-400">
                  Conceal financial numbers into asterisks (••••••••)
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ hideBalance: !settings.hideBalance })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                settings.hideBalance ? 'bg-amber-500' : 'bg-neutral-700'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                settings.hideBalance ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* 2. AES-256 Backup Encryption */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">256-Bit AES Backup Encryption</p>
                <p className="text-xs text-neutral-400">
                  Encrypt JSON backups using Web Crypto AES-GCM
                </p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ encryptBackups: !settings.encryptBackups })}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                settings.encryptBackups ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                settings.encryptBackups ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* 3. Biometric App Lock */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0a7ea4]/10 text-[#0a7ea4]">
                <Fingerprint size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Biometric App Lock</p>
                <p className="text-xs text-neutral-400">
                  {biometricSupported === false
                    ? 'Not supported on this device'
                    : settings.biometricLock
                    ? 'Locks on every app open'
                    : 'Face ID / Touch ID / Fingerprint'}
                </p>
              </div>
            </div>
            <button
              onClick={handleBiometricToggle}
              disabled={biometricSupported === false || biometricLoading}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 disabled:opacity-40 ${
                settings.biometricLock ? 'bg-[#0a7ea4]' : 'bg-neutral-700'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                settings.biometricLock ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
              {biometricLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>

          {biometricError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Warning size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-[11px] text-red-300">{biometricError}</p>
            </div>
          )}

          {settings.biometricLock && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <Lock size={12} className="text-emerald-400" />
              <p className="text-[11px] text-emerald-300 font-medium">Lock screen active — app requires biometrics to open</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 5: App & Build Information */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">App & Version Info</span>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <img
                src="./apple-touch-icon.png"
                alt="EchoSpend"
                className="w-12 h-12 rounded-2xl object-cover shadow-md shadow-[#0a7ea4]/20 border border-neutral-800/60 flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">EchoSpend</h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0a7ea4]/15 text-[#0a7ea4] border border-[#0a7ea4]/30">
                    v{APP_VERSION}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Voice-First Expense Tracking & Smart Budget
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Current Release</span>
              <span className="font-mono text-white font-semibold">v{APP_VERSION} ({GIT_HASH})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Build Timestamp</span>
              <span className="font-mono text-neutral-300 text-[11px]">
                {new Date(BUILD_TIME).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Build Target</span>
              <span className="text-neutral-300 font-medium">Production PWA • Standalone</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Instance Status</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active & Offline-Ready
              </span>
            </div>

            {checkResultText && (
              <div className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-medium ${
                hasNewUpdate
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-neutral-800/60 border border-neutral-800 text-neutral-300'
              }`}>
                {hasNewUpdate ? (
                  <Sparkle size={16} weight="fill" className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Check size={16} weight="bold" className="text-[#0a7ea4] flex-shrink-0" />
                )}
                <span className="leading-snug">{checkResultText}</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isCheckingUpdate}
                onClick={handleManualCheckUpdate}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <ArrowsClockwise size={16} weight="bold" className={isCheckingUpdate ? 'animate-spin' : ''} />
                <span>{isCheckingUpdate ? 'Checking Server...' : 'Check for Updates'}</span>
              </button>

              {hasNewUpdate && (
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0a7ea4] to-[#2dd4bf] text-neutral-950 text-xs font-bold transition-all shadow-lg shadow-[#0a7ea4]/20 flex items-center justify-center gap-1.5 active:scale-95 animate-pulse"
                >
                  <RocketLaunch size={16} weight="fill" />
                  <span>Update Ready</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Backup & Restore */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {t('backupAndRestore') || 'Backup & Restore'}
          </span>
          {settings.encryptBackups && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Lock size={10} />
              AES-256 Enabled
            </span>
          )}
        </div>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 space-y-4">
          <p className="text-xs text-neutral-400 leading-relaxed">
            {t('backupExportDesc') || 'Export and backup your complete financial records, or restore from a previously downloaded EchoSpend JSON file.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Export Button */}
            <button
              type="button"
              disabled={exportLoading}
              onClick={handleExport}
              className="p-4 rounded-2xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 text-white flex items-center justify-between group transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0a7ea4]/15 border border-[#0a7ea4]/30 flex items-center justify-center text-[#0a7ea4]">
                  <DownloadSimple size={20} weight="bold" className={exportLoading ? 'animate-bounce' : ''} />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-xs font-bold text-white group-hover:text-[#0a7ea4] transition-colors">
                    {t('exportBackup') || 'Export Backup'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {settings.encryptBackups ? 'AES-256 .json' : 'Standard .json'}
                  </p>
                </div>
              </div>
            </button>

            {/* Import Button */}
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleTriggerImport}
              className="p-4 rounded-2xl bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 text-white flex items-center justify-between group transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <UploadSimple size={20} weight="bold" />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {t('importBackup') || 'Import & Restore'}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Select .json backup
                  </p>
                </div>
              </div>
            </button>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>

          {/* Export Toast / Status */}
          {exportToast && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 text-[#0a7ea4] text-xs font-medium">
              <Check size={16} weight="bold" className="flex-shrink-0" />
              <span>{exportToast}</span>
            </div>
          )}

          {/* Import Toast / Status */}
          {importToast && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Check size={16} weight="bold" className="flex-shrink-0" />
              <span>{importToast}</span>
            </div>
          )}

          {/* Import Error */}
          {importError && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              <Warning size={16} weight="bold" className="flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Data Management */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-red-400 px-1">Danger Zone</span>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4">
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="w-full py-3 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
          >
            <Trash size={16} />
            <span>Delete All Data / Reset App</span>
          </button>
        </div>
      </div>

      {/* Budget Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Set Monthly Budget">
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Monthly Budget Amount ({currencySymbol})
            </label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              autoFocus
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white font-mono text-xl font-bold focus:outline-none focus:border-[#0a7ea4]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-sm font-bold shadow-lg shadow-[#0a7ea4]/20"
            >
              Save Target
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Reset All Data">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <Warning size={24} className="text-red-400 flex-shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-bold text-white">Warning: Irreversible Action</p>
              <p className="text-xs text-neutral-300 mt-1">
                This will permanently erase all transactions, custom wallets, and subscriptions from your device.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetAllData}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/30"
            >
              Delete Everything
            </button>
          </div>
        </div>
      </Modal>

      {/* Sheets */}
      <ActionSheet
        isOpen={langSheetOpen}
        onClose={() => setLangSheetOpen(false)}
        title={t('language')}
        options={[
          { value: 'en', label: 'English' },
          { value: 'ar', label: 'العربية' }
        ]}
        selectedValue={settings.language}
        onSelect={(val) => updateSettings({ language: val as any })}
        lang={lang}
      />

      <ActionSheet
        isOpen={voiceLangSheetOpen}
        onClose={() => setVoiceLangSheetOpen(false)}
        title="Voice Speech Language"
        options={[
          { value: 'ar-EG', label: 'عربي (Egyptian Arabic)' },
          { value: 'en-US', label: 'English (United States)' }
        ]}
        selectedValue={settings.voiceLanguage || 'ar-EG'}
        onSelect={(val) => updateSettings({ voiceLanguage: val as any })}
        lang={lang}
      />

      <ActionSheet
        isOpen={currencySheetOpen}
        onClose={() => setCurrencySheetOpen(false)}
        title="Default Currency"
        options={[
          { value: 'EGP', label: 'EGP (ج.م)' },
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'SAR', label: 'SAR (ر.س)' },
          { value: 'AED', label: 'AED (د.إ)' }
        ]}
        selectedValue={settings.currency}
        onSelect={(val) => updateSettings({ currency: val })}
        lang={lang}
      />

      <Modal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <CategoryForm 
          key={editingCategory ? editingCategory.id : 'new'} 
          onSuccess={() => setIsCategoryModalOpen(false)} 
          initialData={editingCategory} 
        />
      </Modal>

      <Modal isOpen={isRemoveWhisperModalOpen} onClose={() => setIsRemoveWhisperModalOpen(false)} title="Remove Offline Package">
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Warning size={22} className="text-amber-400 flex-shrink-0" weight="fill" />
            <p className="text-sm text-neutral-300">
              This will remove the Whisper AI model (~40 MB) from your device. Voice input will require internet again.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsRemoveWhisperModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsRemoveWhisperModalOpen(false);
                await removeWhisperCache();
              }}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
            >
              Remove Package
            </button>
          </div>
        </div>
      </Modal>

      {/* PWA Update Prompt Modal */}
      <UpdatePromptModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onUpdate={reloadAndApplyUpdate}
        currentVersion={APP_VERSION}
      />

      {/* Confirm Restore Modal */}
      <Modal 
        isOpen={isConfirmImportOpen} 
        onClose={() => {
          if (!isRestoring) {
            setIsConfirmImportOpen(false);
            setPendingBackup(null);
          }
        }} 
        title="Confirm Backup Restore"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={20} weight="bold" />
              <span className="text-sm font-bold text-white">Valid Backup Verified</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">Wallets / Accounts</span>
                <span className="text-white font-bold text-sm">{pendingBackup?.stats?.walletsCount ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">Transactions</span>
                <span className="text-white font-bold text-sm">{pendingBackup?.stats?.transactionsCount ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">Categories</span>
                <span className="text-white font-bold text-sm">{pendingBackup?.stats?.categoriesCount ?? 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-400 block text-[10px]">Subscriptions</span>
                <span className="text-white font-bold text-sm">{pendingBackup?.stats?.subscriptionsCount ?? 0}</span>
              </div>
            </div>

            {pendingBackup?.stats?.exportDate && (
              <p className="text-[10px] text-neutral-400">
                Backup timestamp: {new Date(pendingBackup.stats.exportDate).toLocaleString()}
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <Warning size={18} className="text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Restoring this backup will replace all current wallets, transactions, and categories with the backup data.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => {
                setIsConfirmImportOpen(false);
                setPendingBackup(null);
              }}
              className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleExecuteRestore}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRestoring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <span>Confirm & Restore</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Decrypt Password Modal */}
      <Modal 
        isOpen={passwordModalOpen} 
        onClose={() => {
          if (!isDecrypting) setPasswordModalOpen(false);
        }} 
        title="Unlock Encrypted Backup"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#0a7ea4]/10 border border-[#0a7ea4]/30 flex items-center gap-3">
            <Lock size={20} className="text-[#0a7ea4] flex-shrink-0" />
            <p className="text-xs text-neutral-300 leading-relaxed">
              This backup was encrypted with a custom password. Please enter the password to decrypt and restore.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Decryption Password
            </label>
            <input
              type="password"
              autoFocus
              value={decryptPassword}
              onChange={(e) => {
                setDecryptPassword(e.target.value);
                setPasswordError(null);
              }}
              placeholder="Enter password..."
              className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-[#0a7ea4]"
            />
            {passwordError && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">{passwordError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isDecrypting}
              onClick={() => setPasswordModalOpen(false)}
              className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm font-semibold hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDecrypting || !decryptPassword}
              className="flex-1 py-3 rounded-xl bg-[#0a7ea4] hover:bg-[#086F8A] text-white text-sm font-bold shadow-lg shadow-[#0a7ea4]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDecrypting ? 'Decrypting...' : 'Unlock Backup'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

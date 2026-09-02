import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { Waveform, Moon, Sun, CaretRight, Translate, UserCircle, Trash, Warning, CurrencyDollar } from '@phosphor-icons/react';
import { useState } from 'react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ActionSheet } from '../ui/ActionSheet';
import { Modal } from '../ui/Modal';
import { CategoryForm } from '../forms/CategoryForm';
import type { Category } from '../../store/useStore';
import { Plus } from '@phosphor-icons/react';

export function SettingsView() {
  const { settings, categories, updateSettings, initData } = useStore();
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [voiceLangSheetOpen, setVoiceLangSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  const currencySymbol = settings.currency || 'EGP';

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newBudget);
    if (!isNaN(val) && val > 0) {
      await updateSettings({ monthlyBudget: val });
      setIsBudgetModalOpen(false);
    }
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

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Settings</h2>
        <p className="text-xs text-neutral-400 font-medium">Preferences & data management</p>
      </div>

      {/* User Profile Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-900/90 border border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0a7ea4]/20 border border-[#0a7ea4]/30 flex items-center justify-center text-[#0a7ea4] font-bold text-lg">
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
        <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-semibold">
          Offline PWA
        </span>
      </div>

      {/* Section 1: Monthly Budget & Categories */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">Budget & Limits</span>

        <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 divide-y divide-neutral-800/80">
          
          {/* Monthly Budget Setting */}
          <button 
            onClick={() => {
              setNewBudget(settings.monthlyBudget?.toString() || '25000');
              setIsBudgetModalOpen(true);
            }}
            className="pb-4 flex justify-between items-center w-full active:scale-[0.99] transition-all text-left"
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
                {currencySymbol} {(settings.monthlyBudget || 25000).toLocaleString()}
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
                  onClick={() => {
                    setEditingCategory(c);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col items-center gap-1.5 active:scale-95 transition-all hover:border-[#0a7ea4]/40"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: `${c.color}25`, color: c.color }}
                  >
                    <CategoryIcon name={c.iconName} size={18} />
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

          {/* Dark / Light Mode */}
          <button 
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="py-3.5 flex justify-between items-center w-full active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium text-sm">
              {settings.theme === 'dark' ? <Moon size={20} className="text-[#0a7ea4]" /> : <Sun size={20} className="text-[#0a7ea4]" />}
              <span>Dark Theme</span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.theme === 'dark' ? 'bg-[#0a7ea4]' : 'bg-neutral-800'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${settings.theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>

        </div>
      </div>

      {/* Section 3: Danger Zone / Reset */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-red-400 px-1">Data Management</span>

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
              required
              autoFocus
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="25000"
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

    </div>
  );
}

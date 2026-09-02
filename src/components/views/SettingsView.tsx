import { useStore } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { Waveform, Export, Moon, Sun, CaretRight, Translate } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { CategoryIcon } from '../ui/CategoryIcon';
import { ActionSheet } from '../ui/ActionSheet';
import { Modal } from '../ui/Modal';
import { CategoryForm } from '../forms/CategoryForm';
import type { Category } from '../../store/useStore';
import { Plus } from '@phosphor-icons/react';

export function SettingsView() {
  const { settings, categories, transactions, updateSettings } = useStore();
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [voiceLangSheetOpen, setVoiceLangSheetOpen] = useState(false);
  const [currencySheetOpen, setCurrencySheetOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EGP' ? 'ج.م ' : '';

  // Calculate budget progress
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const budgetProgress = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense' && c.budgetLimit)
      .map(cat => {
        const spent = transactions.reduce((sum, tx) => {
          const d = new Date(tx.date);
          if (tx.categoryId === cat.id && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            return sum + tx.amount;
          }
          return sum;
        }, 0);
        
        const limit = cat.budgetLimit || 0;
        const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
        
        return {
          ...cat,
          spent,
          limit,
          percentage
        };
      });
  }, [categories, transactions]);

  return (
    <div className="space-y-8 pb-20 font-arabic" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className="text-3xl font-bold text-center text-white mb-8">{t('settings')}</h2>

      {/* Section 1: Budgets & Categories */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-2">{t('categoriesAndBudgets')}</h3>
        
        {/* Monthly Budgets Block */}
        <div className="bg-brand-light/30 border border-brand-light/20 rounded-3xl p-5 backdrop-blur-sm space-y-4">
          <h4 className="font-bold text-white mb-4">{t('monthlyBudgets')}</h4>
          
          {budgetProgress.map((budget, i) => (
            <div key={budget.id} className="relative h-12 bg-brand-darker rounded-xl overflow-hidden flex items-center px-4 border border-brand-light/10">
              {/* Progress Fill */}
              <div 
                className="absolute top-0 bottom-0 right-0 left-0 opacity-80" 
                style={{ 
                  width: `${budget.percentage}%`, 
                  backgroundColor: i === 0 ? '#59bca4' : i === 1 ? '#f18b32' : budget.color,
                  right: lang === 'ar' ? 0 : 'auto',
                  left: lang === 'ar' ? 'auto' : 0
                }}
              />
              
              {/* Content on top of progress */}
              <div className="relative z-10 w-full flex justify-between items-center text-sm font-bold shadow-sm">
                <span className="text-white drop-shadow-md">{budget.name}</span>
                <div className="flex items-center gap-4 drop-shadow-md">
                  <span className="text-white">{budget.percentage}%</span>
                  <span className="text-neutral-200">
                    <span dir="ltr">{currencySymbol}{budget.limit}</span> / <span dir="ltr">{currencySymbol}{budget.spent}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {budgetProgress.length === 0 && (
            <p className="text-brand-gray text-sm">{t('noBudgetsSet')}</p>
          )}
        </div>

        {/* Define New Categories Block */}
        <div className="bg-brand-light/30 border border-brand-light/20 rounded-3xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-white">{t('defineNewCategories')}</h4>
            <button className="text-brand-teal text-sm font-bold flex items-center gap-1">
              {t('viewAll')} <CaretRight size={14} />
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            {categories.slice(0, 7).map(c => (
              <button 
                key={c.id} 
                onClick={() => {
                  setEditingCategory(c);
                  setIsCategoryModalOpen(true);
                }}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform group"
              >
                <div className="w-12 h-12 rounded-2xl border border-brand-light/30 bg-brand-darker flex items-center justify-center text-brand-teal group-hover:bg-brand-light/5 transition-colors">
                  <div className="text-2xl"><CategoryIcon name={c.iconName} size={24} /></div>
                </div>
                <span className="text-xs text-brand-gray font-medium truncate w-full text-center group-hover:text-neutral-200 transition-colors">{c.name}</span>
              </button>
            ))}
            
            {/* Add New Category Button */}
            <button 
              onClick={() => {
                setEditingCategory(undefined);
                setIsCategoryModalOpen(true);
              }}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform group"
            >
              <div className="w-12 h-12 rounded-2xl border border-dashed border-brand-light/40 bg-brand-dark/50 flex items-center justify-center text-brand-gray group-hover:border-brand-teal group-hover:text-brand-teal transition-colors">
                <Plus size={24} />
              </div>
              <span className="text-xs text-brand-gray font-medium truncate w-full text-center group-hover:text-brand-teal transition-colors">Add New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Account & App Settings */}
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-white mb-2">{t('accountAndAppSetup')}</h3>
        
        <div className="bg-brand-light/30 border border-brand-light/20 rounded-3xl p-5 backdrop-blur-sm divide-y divide-brand-light/10">
          
          {/* App Language Settings */}
          <button 
            onClick={() => setLangSheetOpen(true)}
            className="py-4 flex justify-between items-center first:pt-0 w-full active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium">
              <Translate size={24} className="text-brand-teal" />
              <span>{t('language')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-gray text-sm font-bold">{settings.language === 'ar' ? 'العربية' : 'English'}</span>
              <CaretRight size={16} className="text-brand-gray" />
            </div>
          </button>

          {/* Voice Settings */}
          <button 
            onClick={() => setVoiceLangSheetOpen(true)}
            className="py-4 flex justify-between items-center w-full active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium">
              <Waveform size={24} className="text-brand-teal" />
              <span>{t('voiceCalibration')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-gray text-sm font-bold">{settings.voiceLanguage === 'ar-EG' ? 'عربي' : 'English'}</span>
              <CaretRight size={16} className="text-brand-gray" />
            </div>
          </button>

          {/* Currency */}
          <button 
            onClick={() => setCurrencySheetOpen(true)}
            className="py-4 flex justify-between items-center w-full active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium">
              <span className="text-xl font-bold text-brand-teal px-1">$</span>
              <span>{t('defaultCurrency')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-gray text-sm font-bold">{settings.currency === 'EGP' ? 'EGP (ج.م)' : 'USD ($)'}</span>
              <CaretRight size={16} className="text-brand-gray" />
            </div>
          </button>

          {/* Data Export */}
          <button className="py-4 flex justify-between items-center w-full active:scale-95 transition-all">
            <div className="flex items-center gap-3 text-white font-medium">
              <Export size={24} className="text-brand-teal" />
              <span>{t('exportData')}</span>
            </div>
            <CaretRight size={20} className="text-brand-gray" />
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="py-4 flex justify-between items-center w-full last:pb-0 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3 text-white font-medium">
              {settings.theme === 'dark' ? <Moon size={24} className="text-brand-teal" /> : <Sun size={24} className="text-brand-teal" />}
              <span>{t('themeDarkLight')}</span>
            </div>
            
            <div 
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.theme === 'dark' ? 'bg-brand-teal' : 'bg-brand-gray'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-brand-darker absolute top-0.5 transition-all ${settings.theme === 'dark' ? (lang === 'ar' ? 'left-0.5' : 'right-0.5') : (lang === 'ar' ? 'right-0.5' : 'left-0.5')}`} />
            </div>
          </button>

        </div>
      </div>

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
        title={t('voiceCalibration')}
        options={[
          { value: 'en-US', label: 'English' },
          { value: 'ar-EG', label: 'عربي' }
        ]}
        selectedValue={settings.voiceLanguage || 'en-US'}
        onSelect={(val) => updateSettings({ voiceLanguage: val as any })}
        lang={lang}
      />

      <ActionSheet
        isOpen={currencySheetOpen}
        onClose={() => setCurrencySheetOpen(false)}
        title={t('defaultCurrency')}
        options={[
          { value: 'USD', label: 'USD ($)' },
          { value: 'EGP', label: 'EGP (ج.م)' }
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

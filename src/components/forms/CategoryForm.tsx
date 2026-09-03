import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Category } from '../../store/useStore';
import { getTranslation } from '../../lib/i18n';
import { Check, Trash } from '@phosphor-icons/react';
import { CategoryIcon, availableIcons, popularEmojis } from '../ui/CategoryIcon';
import { ConfirmModal } from '../ui/ConfirmModal';

interface CategoryFormProps {
  onSuccess: () => void;
  initialData?: Category;
}

export function CategoryForm({ onSuccess, initialData }: CategoryFormProps) {
  const { settings, addCategory, updateCategory, deleteCategory } = useStore();
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<'expense' | 'income'>(initialData?.type || 'expense');
  const [iconName, setIconName] = useState(initialData?.iconName || availableIcons[0]);
  const [color, setColor] = useState(initialData?.color || '#59bca4');
  const [budgetLimit, setBudgetLimit] = useState(initialData?.budgetLimit ? initialData.budgetLimit.toString() : '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!settings) return null;
  const lang = settings.language;
  const t = (key: any) => getTranslation(lang, key);
  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EGP' ? 'ج.م ' : '';

  const presetColors = ['#59bca4', '#f18b32', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e', '#eab308'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialData) {
      await updateCategory(initialData.id, {
        name,
        type,
        iconName,
        color,
        budgetLimit: budgetLimit ? Number(budgetLimit) : undefined
      });
    } else {
      await addCategory({
        name,
        type,
        iconName,
        color,
        budgetLimit: budgetLimit ? Number(budgetLimit) : undefined
      });
    }
    onSuccess();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-brand-dark" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-brand-gray">Category Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-brand-darker border border-brand-light/20 text-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-brand-teal transition-colors"
            placeholder="e.g. Groceries"
          />
        </div>

        {/* Type Toggle */}
        <div className="flex bg-brand-darker border border-brand-light/20 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
              type === 'expense' ? 'bg-brand-light/30 text-white' : 'text-brand-gray'
            }`}
          >
            {t('expense')}
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
              type === 'income' ? 'bg-brand-light/30 text-white' : 'text-brand-gray'
            }`}
          >
            {t('income')}
          </button>
        </div>

        {/* Budget Limit (Only for expenses) */}
        {type === 'expense' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-brand-gray">Monthly Budget Limit (Optional)</label>
            <div className="flex items-center gap-2 bg-brand-darker border border-brand-light/20 rounded-xl px-4 py-2 focus-within:border-brand-teal transition-colors" style={{ direction: 'ltr' }}>
              <span className="text-brand-gray">{currencySymbol}</span>
              <input
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full bg-transparent text-neutral-200 outline-none text-left"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Icon Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-brand-gray">Icon or Emoji</label>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm"
              style={{ backgroundColor: `${color}25`, color: color }}
            >
              <CategoryIcon name={iconName} size={18} />
            </div>
          </div>

          {/* Custom Emoji / Text Input */}
          <div className="flex items-center gap-2 bg-brand-darker border border-brand-light/20 rounded-xl px-3 py-2 focus-within:border-brand-teal transition-colors">
            <span className="text-xs text-brand-gray">Custom Emoji / Initial:</span>
            <input
              type="text"
              maxLength={4}
              value={iconName.length <= 4 && !availableIcons.includes(iconName) ? iconName : ''}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  setIconName(e.target.value.trim());
                }
              }}
              placeholder="e.g. 🍕 or Gym"
              className="bg-transparent text-sm text-neutral-200 outline-none flex-1 font-medium"
            />
          </div>

          {/* Quick Popular Emojis */}
          <div className="space-y-1">
            <span className="text-[11px] text-brand-gray font-medium">Popular Emojis:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {popularEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIconName(emoji)}
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-base transition-all ${
                    iconName === emoji
                      ? 'bg-brand-teal/20 border border-brand-teal scale-105'
                      : 'bg-brand-darker border border-brand-light/10 hover:bg-brand-light/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Standard Vector Icons Grid */}
          <div className="space-y-1">
            <span className="text-[11px] text-brand-gray font-medium">Standard Icons:</span>
            <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {availableIcons.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setIconName(icon)}
                  className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                    iconName === icon
                      ? 'bg-brand-teal/20 text-brand-teal border border-brand-teal scale-105'
                      : 'bg-brand-darker border border-brand-light/10 text-brand-gray hover:bg-brand-light/10'
                  }`}
                >
                  <CategoryIcon name={icon} size={18} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3 pb-8">
          <label className="text-sm font-medium text-brand-gray">Color</label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {presetColors.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark' : ''
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={16} weight="bold" className="text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-brand-light/10 bg-brand-dark flex gap-3">
        {initialData && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors active:scale-95"
          >
            <Trash size={24} />
          </button>
        )}
        <button
          type="submit"
          className="flex-1 bg-brand-teal hover:bg-[#4eb39b] text-brand-dark font-bold text-lg py-4 rounded-2xl transition-colors shadow-teal-glow flex justify-center items-center gap-2 active:scale-95"
        >
          <Check weight="bold" size={24} />
          Save
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (initialData) {
            await deleteCategory(initialData.id);
            onSuccess();
          }
        }}
        title="Delete Category"
        message={`Are you sure you want to delete "${initialData?.name}"? Transactions using this category will be preserved.`}
        confirmText="Delete"
      />
    </form>
  );
}

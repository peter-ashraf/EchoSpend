export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    settings: 'Settings',

    // Dashboard
    totalNetWorth: 'Total Net Worth',
    addTransaction: 'Add Transaction',
    spendingTrend: 'Spending Trend (Last 7 Days)',
    yourAccounts: 'Your Accounts',
    recentTransactions: 'Recent Transactions',

    // Transactions
    searchTransactions: 'Search transactions...',
    filter: 'Filter',
    noTransactions: 'No transactions found.',

    // Settings
    preferences: 'Preferences',
    accounts: 'Accounts',
    categories: 'Categories',
    managePreferences: 'Manage your preferences, accounts, and categories.',
    theme: 'Theme',
    chooseAppearance: 'Choose your preferred appearance.',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    baseCurrency: 'Base Currency',
    primaryCurrency: 'Your primary display currency.',
    language: 'App Language',
    chooseLanguage: 'Choose the app language.',
    voiceLanguage: 'Voice Language',
    chooseVoiceLanguage: 'Choose language for voice input.',
    addAccount: 'Add Account',
    addCategory: 'Add Category',
    categoriesAndBudgets: 'Categories & Budgets',
    budget: 'Budget',
    monthlyBudgets: 'Monthly Budgets',
    noBudgetsSet: 'No budgets set yet.',
    defineNewCategories: 'Define New Categories',
    viewAll: 'View All',
    accountAndAppSetup: 'Account & App Settings',
    voiceCalibration: 'Voice Calibration',
    defaultCurrency: 'Default Currency',
    exportData: 'Export Data',
    themeDarkLight: 'Theme: Dark/Light',

    // Transaction Form
    amount: 'Amount',
    account: 'Account',
    category: 'Category',
    note: 'Note (Optional)',
    date: 'Date',
    whatWasThisFor: 'What was this for?',
    saveTransaction: 'Save Transaction',
    selectAccount: 'Select Account',
    selectCategory: 'Select Category',
    expense: 'Expense',
    income: 'Income',
    transfer: 'Transfer',
    confirmVoiceEntry: 'Confirm Voice Entry',
    
    // Voice
    listening: 'Listening...',
    voiceError: 'Could not understand. Please try again.',
    voiceNotSupported: 'Speech recognition not supported in this browser.',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة القيادة',
    transactions: 'المعاملات',
    settings: 'الإعدادات',

    // Dashboard
    totalNetWorth: 'إجمالي الثروة',
    addTransaction: 'إضافة معاملة',
    spendingTrend: 'اتجاه الإنفاق (آخر 7 أيام)',
    yourAccounts: 'حساباتك',
    recentTransactions: 'المعاملات الأخيرة',

    // Transactions
    searchTransactions: 'البحث في المعاملات...',
    filter: 'تصفية',
    noTransactions: 'لم يتم العثور على معاملات.',

    // Settings
    preferences: 'التفضيلات',
    accounts: 'الحسابات',
    categories: 'الفئات',
    managePreferences: 'إدارة التفضيلات والحسابات والفئات.',
    theme: 'المظهر',
    chooseAppearance: 'اختر المظهر المفضل لديك.',
    system: 'النظام',
    light: 'فاتح',
    dark: 'داكن',
    baseCurrency: 'العملة الأساسية',
    primaryCurrency: 'عملة العرض الأساسية الخاصة بك.',
    language: 'لغة واجهة التطبيق',
    chooseLanguage: 'اختر لغة التطبيق.',
    voiceLanguage: 'لغة الإدخال الصوتي',
    chooseVoiceLanguage: 'اختر اللغة للتعرف على الصوت.',
    addAccount: 'إضافة حساب',
    addCategory: 'إضافة فئة',
    categoriesAndBudgets: 'الفئات والميزانيات',
    budget: 'الميزانية',
    monthlyBudgets: 'الميزانيات الشهرية',
    noBudgetsSet: 'لم يتم تحديد ميزانيات بعد.',
    defineNewCategories: 'تعريف فئات جديدة',
    viewAll: 'عرض الكل',
    accountAndAppSetup: 'إعدادات الحساب والتطبيق',
    voiceCalibration: 'معايرة الصوت',
    defaultCurrency: 'العملة الإفتراضية',
    exportData: 'تصدير البيانات',
    themeDarkLight: 'المظهر: داكن/فاتح',

    // Transaction Form
    amount: 'المبلغ',
    account: 'الحساب',
    category: 'الفئة',
    note: 'ملاحظة (اختياري)',
    date: 'التاريخ',
    whatWasThisFor: 'بخصوص ماذا كان هذا؟',
    saveTransaction: 'حفظ المعاملة',
    selectAccount: 'اختر الحساب',
    selectCategory: 'اختر الفئة',
    expense: 'مصروف',
    income: 'دخل',
    transfer: 'تحويل',
    confirmVoiceEntry: 'تأكيد الإدخال الصوتي',
    
    // Voice
    listening: 'يستمع...',
    voiceError: 'تعذر الفهم. يرجى المحاولة مرة أخرى.',
    voiceNotSupported: 'التعرف على الصوت غير مدعوم في هذا المتصفح.',
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

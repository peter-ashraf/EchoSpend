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
    exportData: 'Export Data',
    backupAndRestore: 'Backup & Restore',
    exportBackup: 'Export Backup (JSON)',
    importBackup: 'Import & Restore Backup',
    backupExportDesc: 'Save all your wallets, transactions, categories, and settings to a JSON file.',
    backupImportDesc: 'Restore your complete financial records from an EchoSpend backup file.',
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
    
    // Subscriptions
    subscriptions: 'Subscriptions',
    monthlySpending: 'Monthly Spending',
    recurringPayments: 'Recurring payments & renewals',
    dueToday: 'Due Today',
    dueTomorrow: 'Due Tomorrow',
    upcomingRenewals: 'Upcoming Renewals',
    activeSubscriptions: 'Active Subscriptions',
    addSubscription: 'Add Subscription',
    editSubscription: 'Edit Subscription',

    // Cards & Cash
    cardsAndCash: 'Cards & Cash',
    bankCardsAndWallets: 'Bank cards, digital wallets & cash',
    totalNetBalance: 'Total Net Balance',
    addCard: 'Add Card',
    addCash: 'Add Cash',
    cardholderName: 'Cardholder Name',
    noAccountsYet: 'No Accounts or Cards Yet',

    // Analytics
    trendsAndInsights: 'Trends & Insights',
    weeklySpending: 'Weekly Spending',
    categoryBreakdown: 'Category Breakdown',
    topMerchants: 'Top Merchants',
    thisWeek: 'This Week',

    // General & Actions
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    update: 'Update',
    save: 'Save',
    edit: 'Edit',
    back: 'Back',
    close: 'Close',
    success: 'Success',
    error: 'Error',
    done: 'Done',
    privacyMode: 'Privacy Mode',
    
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
    exportData: 'تصدير البيانات',
    backupAndRestore: 'النسخ الاحتياطي والاستعادة',
    exportBackup: 'تصدير نسخة احتياطية (JSON)',
    importBackup: 'استيراد واستعادة البيانات',
    backupExportDesc: 'حفظ جميع المحافظ والمعاملات والفئات والإعدادات كملف JSON.',
    backupImportDesc: 'استعادة سجلك المالي الكامل من ملف نسخة احتياطية لـ EchoSpend.',
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

    // Subscriptions
    subscriptions: 'الاشتراكات',
    monthlySpending: 'الإنفاق الشهري',
    recurringPayments: 'المدفوعات المتكررة والتجديدات',
    dueToday: 'مستحق اليوم',
    dueTomorrow: 'مستحق غداً',
    upcomingRenewals: 'التجديدات القادمة',
    activeSubscriptions: 'الاشتراكات النشطة',
    addSubscription: 'إضافة اشتراك',
    editSubscription: 'تعديل الاشتراك',

    // Cards & Cash
    cardsAndCash: 'البطاقات والنقد',
    bankCardsAndWallets: 'البطاقات البنكية، المحافظ الرقمية والنقد',
    totalNetBalance: 'إجمالي الرصيد الصافي',
    addCard: 'إضافة بطاقة',
    addCash: 'إضافة كاش',
    cardholderName: 'اسم حامل البطاقة',
    noAccountsYet: 'لا توجد حسابات أو بطاقات بعد',

    // Analytics
    trendsAndInsights: 'الاتجاهات والتحليلات',
    weeklySpending: 'الإنفاق الأسبوعي',
    categoryBreakdown: 'توزيع الفئات',
    topMerchants: 'أعلى المتاجر',
    thisWeek: 'هذا الأسبوع',

    // General & Actions
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    delete: 'حذف',
    update: 'تحديث',
    save: 'حفظ',
    edit: 'تعديل',
    back: 'رجوع',
    close: 'إغلاق',
    success: 'نجاح',
    error: 'خطأ',
    done: 'تم',
    privacyMode: 'وضع الخصوصية',
    
    // Voice
    listening: 'يستمع...',
    voiceError: 'تعذر الفهم. يرجى المحاولة مرة أخرى.',
    voiceNotSupported: 'التعرف على الصوت غير مدعوم في هذا المتصفح.',
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

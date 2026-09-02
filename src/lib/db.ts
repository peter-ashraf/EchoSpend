import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface Settings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: 'en' | 'ar';
  voiceLanguage: 'en-US' | 'ar-EG';
  monthlyBudget: number;
  onboarded: boolean;
  /** 'not-asked' = first-use prompt not yet shown; 'declined' = user said no; 'ready' = model cached */
  offlineVoiceStatus: 'not-asked' | 'declined' | 'ready';
  /** Whether biometric lock is enabled */
  biometricLock: boolean;
  /** Stored WebAuthn credential id (base64url) */
  biometricCredentialId?: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'digital';
  balance: number;
  color: string;
  last4?: string;
  institution?: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  date: string;
  note?: string;
  merchant?: string;
  type: 'expense' | 'income' | 'transfer';
  source?: 'voice' | 'sms' | 'manual' | 'recurring';
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  iconName: string;
  color: string;
  budgetLimit?: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  categoryId: string;
  walletId?: string;
  iconName?: string;
  brandColor?: string;
  active: boolean;
  notes?: string;
}

export interface HabitStreak {
  id: string;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  history: string[]; // ISO date strings 'YYYY-MM-DD'
}

interface EchoSpendDB extends DBSchema {
  settings: {
    key: string;
    value: Settings;
  };
  wallets: {
    key: string;
    value: Wallet;
  };
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-wallet': string; 'by-date': string };
  };
  categories: {
    key: string;
    value: Category;
  };
  subscriptions: {
    key: string;
    value: Subscription;
  };
  streaks: {
    key: string;
    value: HabitStreak;
  };
}

let dbPromise: Promise<IDBPDatabase<EchoSpendDB>>;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<EchoSpendDB>('EchoSpendDB', 5, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('wallets', { keyPath: 'id' });
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-wallet', 'walletId');
          txStore.createIndex('by-date', 'date');
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('subscriptions')) {
            db.createObjectStore('subscriptions', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('streaks')) {
            db.createObjectStore('streaks', { keyPath: 'id' });
          }
        }
        // v5: no new stores, new settings fields patched in seedDatabase()
      },
    });
  }
  return dbPromise;
}

export async function seedDatabase() {
  const db = await getDB();
  
  const settingsCount = await db.count('settings');
  if (settingsCount === 0) {
    const defaultSettings: Settings = {
      id: 'app-settings',
      theme: 'system',
      currency: 'EGP',
      language: 'en',
      voiceLanguage: 'ar-EG',
      monthlyBudget: 25000,
      onboarded: false,
      offlineVoiceStatus: 'not-asked',
      biometricLock: false,
    };
    await db.put('settings', defaultSettings);
  } else {
    const currentSettings = await db.get('settings', 'app-settings');
    if (currentSettings) {
      let updated = false;
      if (!currentSettings.language) {
        currentSettings.language = 'en';
        updated = true;
      }
      if (!currentSettings.voiceLanguage) {
        currentSettings.voiceLanguage = 'ar-EG';
        updated = true;
      }
      if (!currentSettings.monthlyBudget) {
        currentSettings.monthlyBudget = 25000;
        updated = true;
      }
      if (!currentSettings.offlineVoiceStatus) {
        currentSettings.offlineVoiceStatus = 'not-asked';
        updated = true;
      }
      if (currentSettings.biometricLock === undefined) {
        currentSettings.biometricLock = false;
        updated = true;
      }
      if (updated) await db.put('settings', currentSettings);
    }
  }

  const walletsCount = await db.count('wallets');
  if (walletsCount === 0) {
    const defaultWallets: Wallet[] = [
      {
        id: 'w-1',
        name: 'Chase Checking',
        type: 'checking',
        balance: 12974.64,
        color: '#0a7ea4',
        last4: '4521',
        institution: 'Chase Bank'
      },
      {
        id: 'w-2',
        name: 'Amex Gold',
        type: 'credit',
        balance: 5250.00,
        color: '#eab308',
        last4: '8834',
        institution: 'American Express'
      },
      {
        id: 'w-3',
        name: 'Cash Wallet',
        type: 'cash',
        balance: 1000.00,
        color: '#10b981',
        institution: 'Cash'
      }
    ];
    for (const w of defaultWallets) {
      await db.put('wallets', w);
    }
  }

  const categoriesCount = await db.count('categories');
  if (categoriesCount === 0) {
    const defaultCategories: Category[] = [
      { id: 'cat-1', name: 'Food & Dining', type: 'expense', iconName: 'ForkKnife', color: '#10b981', budgetLimit: 5000 },
      { id: 'cat-2', name: 'Transportation', type: 'expense', iconName: 'Car', color: '#3b82f6', budgetLimit: 2500 },
      { id: 'cat-3', name: 'Shopping', type: 'expense', iconName: 'ShoppingCart', color: '#8b5cf6', budgetLimit: 4000 },
      { id: 'cat-4', name: 'Subscriptions & Bills', type: 'expense', iconName: 'Receipt', color: '#f59e0b', budgetLimit: 3000 },
      { id: 'cat-5', name: 'Entertainment', type: 'expense', iconName: 'FilmSlate', color: '#ec4899', budgetLimit: 2000 },
      { id: 'cat-6', name: 'Health & Fitness', type: 'expense', iconName: 'Heartbeat', color: '#06b6d4', budgetLimit: 1500 },
      { id: 'cat-7', name: 'Salary & Income', type: 'income', iconName: 'Money', color: '#10b981' },
      { id: 'cat-8', name: 'Transfer', type: 'expense', iconName: 'ArrowsLeftRight', color: '#64748b' }
    ];
    for (const cat of defaultCategories) {
      await db.put('categories', cat);
    }
  }

  const subscriptionsCount = await db.count('subscriptions');
  if (subscriptionsCount === 0) {
    // Generate dates relative to current date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const in5Days = new Date(today);
    in5Days.setDate(today.getDate() + 5);

    const in12Days = new Date(today);
    in12Days.setDate(today.getDate() + 12);

    const defaultSubs: Subscription[] = [
      {
        id: 'sub-1',
        name: 'Netflix',
        amount: 320,
        currency: 'EGP',
        billingCycle: 'monthly',
        nextBillingDate: tomorrow.toISOString().split('T')[0],
        categoryId: 'cat-5',
        walletId: 'w-1',
        iconName: 'Television',
        brandColor: '#E50914',
        active: true,
        notes: 'Premium 4K plan'
      },
      {
        id: 'sub-2',
        name: 'Spotify',
        amount: 89.99,
        currency: 'EGP',
        billingCycle: 'monthly',
        nextBillingDate: in5Days.toISOString().split('T')[0],
        categoryId: 'cat-5',
        walletId: 'w-1',
        iconName: 'Headphones',
        brandColor: '#1DB954',
        active: true,
        notes: 'Individual Premium'
      },
      {
        id: 'sub-3',
        name: 'iCloud+ 200GB',
        amount: 99.99,
        currency: 'EGP',
        billingCycle: 'monthly',
        nextBillingDate: in12Days.toISOString().split('T')[0],
        categoryId: 'cat-4',
        walletId: 'w-1',
        iconName: 'Cloud',
        brandColor: '#007AFF',
        active: true,
        notes: 'Family storage'
      },
      {
        id: 'sub-4',
        name: 'ChatGPT Plus',
        amount: 1000,
        currency: 'EGP',
        billingCycle: 'monthly',
        nextBillingDate: in5Days.toISOString().split('T')[0],
        categoryId: 'cat-4',
        walletId: 'w-2',
        iconName: 'Sparkle',
        brandColor: '#10A37F',
        active: true,
        notes: 'AI Pro'
      }
    ];
    for (const sub of defaultSubs) {
      await db.put('subscriptions', sub);
    }
  }

  // Initialize Streaks
  const streaksCount = await db.count('streaks');
  if (streaksCount === 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialStreak: HabitStreak = {
      id: 'main-streak',
      currentStreak: 5,
      bestStreak: 14,
      lastActiveDate: todayStr,
      history: [todayStr]
    };
    await db.put('streaks', initialStreak);
  }

  // Seed sample recent transactions matching Say app if empty
  const txCount = await db.count('transactions');
  if (txCount === 0) {
    const today = new Date();
    const d = (offset: number) => {
      const dt = new Date(today);
      dt.setDate(today.getDate() - offset);
      return dt.toISOString();
    };

    const sampleTxs: Transaction[] = [
      {
        id: 'tx-1',
        walletId: 'w-1',
        categoryId: 'cat-1',
        amount: 298.68,
        merchant: 'COPA ACAI LEVEN SQUARE',
        date: d(0),
        note: 'Acai bowl & smoothie',
        type: 'expense',
        source: 'voice'
      },
      {
        id: 'tx-2',
        walletId: 'w-1',
        categoryId: 'cat-7',
        amount: 25000.00,
        merchant: 'COMPANY PAYROLL',
        date: d(2),
        note: 'Monthly salary deposit',
        type: 'income',
        source: 'manual'
      },
      {
        id: 'tx-3',
        walletId: 'w-2',
        categoryId: 'cat-3',
        amount: 836.30,
        merchant: 'RETAIL IN RES',
        date: d(3),
        note: 'Clothing & gifts',
        type: 'expense',
        source: 'sms'
      },
      {
        id: 'tx-4',
        walletId: 'w-1',
        categoryId: 'cat-2',
        amount: 145.00,
        merchant: 'UBER RIDE',
        date: d(4),
        note: 'Downtown trip',
        type: 'expense',
        source: 'voice'
      }
    ];

    for (const tx of sampleTxs) {
      await db.put('transactions', tx);
    }
  }
}

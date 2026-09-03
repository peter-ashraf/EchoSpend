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
      monthlyBudget: 0,
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
      if (currentSettings.monthlyBudget === 25000 || currentSettings.monthlyBudget === undefined) {
        currentSettings.monthlyBudget = 0;
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

  // Purge legacy mock data if present in IndexedDB
  const existingTxs = await db.getAll('transactions');
  for (const tx of existingTxs) {
    if (['tx-1', 'tx-2', 'tx-3', 'tx-4'].includes(tx.id)) {
      await db.delete('transactions', tx.id);
    }
  }

  const existingSubs = await db.getAll('subscriptions');
  for (const sub of existingSubs) {
    if (['sub-1', 'sub-2', 'sub-3', 'sub-4'].includes(sub.id)) {
      await db.delete('subscriptions', sub.id);
    }
  }

  const existingWallets = await db.getAll('wallets');
  for (const w of existingWallets) {
    if (['w-1', 'w-2', 'w-3'].includes(w.id) || w.name === 'Main Wallet' || w.name === 'Chase Checking') {
      await db.delete('wallets', w.id);
    }
  }

  const existingStreak = await db.get('streaks', 'main-streak');
  if (existingStreak && (existingStreak.bestStreak === 14 || existingStreak.currentStreak === 5 || existingStreak.currentStreak === 0)) {
    await db.put('streaks', {
      id: 'main-streak',
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: '',
      history: []
    });
  }

  // On first install, accounts list starts completely empty so user configures their own cards.

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

  // Initialize Streaks
  const streaksCount = await db.count('streaks');
  if (streaksCount === 0) {
    const initialStreak: HabitStreak = {
      id: 'main-streak',
      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: '',
      history: []
    };
    await db.put('streaks', initialStreak);
  }
}

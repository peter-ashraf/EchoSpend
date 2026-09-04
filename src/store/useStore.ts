import { create } from 'zustand';
import { getDB, seedDatabase } from '../lib/db';
import type { Wallet, Transaction, Settings, Category as DbCategory, Subscription, HabitStreak } from '../lib/db';
import { encryptData, decryptData } from '../lib/crypto';

export type Category = DbCategory;
export type { Subscription, HabitStreak };

export interface BackupStats {
  walletsCount: number;
  transactionsCount: number;
  categoriesCount: number;
  subscriptionsCount: number;
  hasSettings: boolean;
  exportDate?: string;
  isEncrypted: boolean;
}

export interface BackupInspectionResult {
  valid: boolean;
  isEncrypted: boolean;
  needsPassword?: boolean;
  error?: string;
  stats?: BackupStats;
  payload?: any;
}

export interface ImportResult {
  success: boolean;
  error?: string;
  stats?: BackupStats;
}

export interface AppState {
  settings: Settings | null;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  subscriptions: Subscription[];
  streak: HabitStreak | null;
  selectedMonth: { year: number; month: number };
  isLoading: boolean;
  
  initData: () => Promise<void>;
  setSelectedMonth: (year: number, month: number) => void;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  toggleHideBalance: () => Promise<void>;
  
  // Wallets
  addWallet: (wallet: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'> & { date?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Subscriptions
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (id: string, sub: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  
  // Streaks
  recordHabitActivity: () => Promise<void>;
  
  // Backup & Encryption
  exportData: (password?: string) => Promise<string>;
  inspectBackupData: (jsonData: string, password?: string) => Promise<BackupInspectionResult>;
  importData: (jsonData: string, password?: string) => Promise<ImportResult>;

  // Offline Voice
  setOfflineVoiceStatus: (status: 'not-asked' | 'declined' | 'ready') => Promise<void>;
  removeWhisperCache: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => {
  const now = new Date();
  
  return {
    settings: null,
    wallets: [],
    transactions: [],
    categories: [],
    subscriptions: [],
    streak: null,
    selectedMonth: { year: now.getFullYear(), month: now.getMonth() },
    isLoading: true,

    initData: async () => {
      await seedDatabase();
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      const wallets = await db.getAll('wallets');
      const transactions = await db.getAllFromIndex('transactions', 'by-date');
      const categories = await db.getAll('categories');
      const subscriptions = await db.getAll('subscriptions');
      const streak = await db.get('streaks', 'main-streak') || {
        id: 'main-streak',
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: '',
        history: []
      };
      
      // Sort transactions newest first
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      set({ 
        settings: settings || null, 
        wallets, 
        transactions, 
        categories, 
        subscriptions, 
        streak, 
        isLoading: false 
      });
    },

    setSelectedMonth: (year, month) => {
      set({ selectedMonth: { year, month } });
    },

    updateSettings: async (newSettings) => {
      const db = await getDB();
      const currentSettings = await db.get('settings', 'app-settings');
      if (currentSettings) {
        const updated = { ...currentSettings, ...newSettings };
        await db.put('settings', updated);
        set({ settings: updated });
      }
    },

    addWallet: async (walletData) => {
      const db = await getDB();
      const wallet: Wallet = {
        ...walletData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      };
      await db.put('wallets', wallet);
      await get().initData();
    },

    updateWallet: async (wallet) => {
      const db = await getDB();
      await db.put('wallets', wallet);
      await get().initData();
    },

    deleteWallet: async (id) => {
      const db = await getDB();
      await db.delete('wallets', id);
      await get().initData();
    },

    addCategory: async (categoryData) => {
      const db = await getDB();
      const category: Category = {
        ...categoryData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      };
      await db.put('categories', category);
      await get().initData();
    },

    updateCategory: async (id, categoryData) => {
      const db = await getDB();
      const category = await db.get('categories', id);
      if (category) {
        await db.put('categories', { ...category, ...categoryData });
        await get().initData();
      }
    },

    deleteCategory: async (id) => {
      const db = await getDB();
      await db.delete('categories', id);
      await get().initData();
    },

    addTransaction: async (txData) => {
      const db = await getDB();
      const tx: Transaction = {
        ...txData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        date: txData.date || new Date().toISOString()
      };

      // Update wallet balance
      const wallet = await db.get('wallets', tx.walletId);
      if (wallet) {
        if (tx.type === 'expense') {
          wallet.balance -= tx.amount;
        } else if (tx.type === 'income') {
          wallet.balance += tx.amount;
        }
        await db.put('wallets', wallet);
      }

      await db.put('transactions', tx);
      await get().recordHabitActivity();
      await get().initData();
    },

    deleteTransaction: async (id) => {
      const db = await getDB();
      const tx = await db.get('transactions', id);
      if (tx) {
        // Reverse wallet balance impact
        const wallet = await db.get('wallets', tx.walletId);
        if (wallet) {
          if (tx.type === 'expense') {
            wallet.balance += tx.amount;
          } else if (tx.type === 'income') {
            wallet.balance -= tx.amount;
          }
          await db.put('wallets', wallet);
        }
        await db.delete('transactions', id);
        await get().initData();
      }
    },

    addSubscription: async (subData) => {
      const db = await getDB();
      const sub: Subscription = {
        ...subData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      };
      await db.put('subscriptions', sub);
      await get().initData();
    },

    updateSubscription: async (id, subData) => {
      const db = await getDB();
      const sub = await db.get('subscriptions', id);
      if (sub) {
        await db.put('subscriptions', { ...sub, ...subData });
        await get().initData();
      }
    },

    deleteSubscription: async (id) => {
      const db = await getDB();
      await db.delete('subscriptions', id);
      await get().initData();
    },

    recordHabitActivity: async () => {
      const db = await getDB();
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let streak = await db.get('streaks', 'main-streak');
      
      if (!streak) {
        streak = {
          id: 'main-streak',
          currentStreak: 1,
          bestStreak: 1,
          lastActiveDate: todayStr,
          history: [todayStr]
        };
      } else {
        if (!streak.history.includes(todayStr)) {
          streak.history.push(todayStr);
          // Check consecutive day
          const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
          const today = new Date(todayStr);
          const diffDays = lastDate ? Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)) : 999;
          
          if (streak.currentStreak === 0 || !lastDate) {
            streak.currentStreak = 1;
            if (streak.currentStreak > streak.bestStreak) {
              streak.bestStreak = 1;
            }
          } else if (diffDays === 1) {
            streak.currentStreak += 1;
            if (streak.currentStreak > streak.bestStreak) {
              streak.bestStreak = streak.currentStreak;
            }
          } else if (diffDays > 1) {
            streak.currentStreak = 1;
          }
          streak.lastActiveDate = todayStr;
        }
      }
      await db.put('streaks', streak);
      set({ streak });
    },

    toggleHideBalance: async () => {
      const current = get().settings?.hideBalance ?? false;
      await get().updateSettings({ hideBalance: !current });
    },

    exportData: async (password?: string) => {
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      const wallets = await db.getAll('wallets');
      const transactions = await db.getAll('transactions');
      const categories = await db.getAll('categories');
      const subscriptions = await db.getAll('subscriptions');
      const streaks = await db.getAll('streaks');
      
      const payload = {
        version: '1.3.0',
        appName: 'EchoSpend',
        exportDate: new Date().toISOString(),
        settings: settings || null,
        wallets: wallets || [],
        transactions: transactions || [],
        categories: categories || [],
        subscriptions: subscriptions || [],
        streaks: streaks || []
      };

      if (password || settings?.encryptBackups) {
        const encrypted = await encryptData(payload, password);
        return JSON.stringify(encrypted, null, 2);
      }
      return JSON.stringify(payload, null, 2);
    },

    inspectBackupData: async (jsonData: string, password?: string): Promise<BackupInspectionResult> => {
      try {
        let raw: any;
        try {
          raw = JSON.parse(jsonData);
        } catch {
          return { valid: false, isEncrypted: false, error: 'File is not valid JSON.' };
        }

        let data = raw;
        const isEncrypted = Boolean(raw?.isEncrypted);

        if (isEncrypted) {
          try {
            data = await decryptData(raw, password);
          } catch {
            return {
              valid: false,
              isEncrypted: true,
              needsPassword: true,
              error: 'Encrypted backup. Password required or incorrect.'
            };
          }
        }

        if (!data || typeof data !== 'object') {
          return { valid: false, isEncrypted, error: 'Empty or corrupt backup file.' };
        }

        const wallets = Array.isArray(data.wallets) ? data.wallets : null;
        const transactions = Array.isArray(data.transactions) ? data.transactions : null;
        const categories = Array.isArray(data.categories) ? data.categories : null;

        if (!wallets || !transactions || !categories) {
          return {
            valid: false,
            isEncrypted,
            error: 'Invalid backup: missing accounts, transactions, or categories collections.'
          };
        }

        const subscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];

        return {
          valid: true,
          isEncrypted,
          stats: {
            walletsCount: wallets.length,
            transactionsCount: transactions.length,
            categoriesCount: categories.length,
            subscriptionsCount: subscriptions.length,
            hasSettings: Boolean(data.settings),
            exportDate: data.exportDate || undefined,
            isEncrypted
          },
          payload: data
        };
      } catch (err: any) {
        return { valid: false, isEncrypted: false, error: err?.message || 'Failed to parse backup.' };
      }
    },

    importData: async (jsonData: string, password?: string) => {
      try {
        const inspection = await get().inspectBackupData(jsonData, password);
        if (!inspection.valid || !inspection.payload) {
          return {
            success: false,
            error: inspection.error || 'Invalid backup format.'
          };
        }

        const data = inspection.payload;
        const db = await getDB();
        
        // Prevent seedDatabase from purging mock data over imported user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('echospend_mock_data_purged_v2', 'true');
        }

        await db.clear('settings');
        await db.clear('wallets');
        await db.clear('transactions');
        await db.clear('categories');
        await db.clear('subscriptions');
        await db.clear('streaks');
        
        if (data.settings && typeof data.settings === 'object') {
          await db.put('settings', { ...data.settings, id: 'app-settings' });
        }
        for (const w of data.wallets) {
          await db.put('wallets', w);
        }
        for (const t of data.transactions) {
          await db.put('transactions', t);
        }
        for (const c of data.categories) {
          await db.put('categories', c);
        }
        if (Array.isArray(data.subscriptions)) {
          for (const s of data.subscriptions) {
            await db.put('subscriptions', s);
          }
        }
        if (Array.isArray(data.streaks)) {
          for (const st of data.streaks) {
            await db.put('streaks', st);
          }
        } else if (data.streak && typeof data.streak === 'object') {
          await db.put('streaks', data.streak);
        }
        
        await get().initData();
        return {
          success: true,
          stats: inspection.stats
        };
      } catch (e: any) {
        console.error('Import failed', e);
        return {
          success: false,
          error: e?.message || 'Import failed unexpectedly.'
        };
      }
    },

    setOfflineVoiceStatus: async (status) => {
      await get().updateSettings({ offlineVoiceStatus: status });
    },

    removeWhisperCache: async () => {
      // Clear all browser caches that may contain the Whisper ONNX model files
      try {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          for (const request of keys) {
            if (request.url.includes('whisper') || request.url.includes('.onnx') || request.url.includes('Xenova')) {
              await cache.delete(request);
            }
          }
        }
      } catch (e) {
        console.warn('Cache deletion failed:', e);
      }
      await get().updateSettings({ offlineVoiceStatus: 'not-asked' });
    },
  };
});

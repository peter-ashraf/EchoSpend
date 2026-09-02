import { create } from 'zustand';
import { getDB, seedDatabase } from '../lib/db';
import type { Wallet, Transaction, Settings, Category as DbCategory, Subscription, HabitStreak } from '../lib/db';

export type Category = DbCategory;
export type { Subscription, HabitStreak };

interface AppState {
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
  
  // Backup
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<boolean>;
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
        currentStreak: 5,
        bestStreak: 14,
        lastActiveDate: new Date().toISOString().split('T')[0],
        history: [new Date().toISOString().split('T')[0]]
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
      const todayStr = new Date().toISOString().split('T')[0];
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
          const lastDate = new Date(streak.lastActiveDate);
          const today = new Date(todayStr);
          const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          
          if (diffDays === 1) {
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

    exportData: async () => {
      const db = await getDB();
      const settings = await db.get('settings', 'app-settings');
      const wallets = await db.getAll('wallets');
      const transactions = await db.getAll('transactions');
      const categories = await db.getAll('categories');
      const subscriptions = await db.getAll('subscriptions');
      const streaks = await db.getAll('streaks');
      return JSON.stringify({ settings, wallets, transactions, categories, subscriptions, streaks });
    },

    importData: async (jsonData: string) => {
      try {
        const data = JSON.parse(jsonData);
        if (!data.wallets || !data.transactions || !data.categories) return false;
        
        const db = await getDB();
        
        await db.clear('settings');
        await db.clear('wallets');
        await db.clear('transactions');
        await db.clear('categories');
        await db.clear('subscriptions');
        await db.clear('streaks');
        
        if (data.settings) await db.put('settings', data.settings);
        for (const w of data.wallets) await db.put('wallets', w);
        for (const t of data.transactions) await db.put('transactions', t);
        for (const c of data.categories) await db.put('categories', c);
        if (data.subscriptions) {
          for (const s of data.subscriptions) await db.put('subscriptions', s);
        }
        if (data.streaks) {
          for (const st of data.streaks) await db.put('streaks', st);
        }
        
        await get().initData();
        return true;
      } catch (e) {
        console.error('Import failed', e);
        return false;
      }
    }
  };
});

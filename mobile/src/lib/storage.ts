import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category, Transaction, Wallet } from './types';

const STORAGE_KEYS = {
  TRANSACTIONS: '@echospend_transactions_v1',
  WALLETS: '@echospend_wallets_v1',
  CATEGORIES: '@echospend_categories_v1',
  MONTHLY_BUDGET: '@echospend_monthly_budget_v1'
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', iconName: 'restaurant', color: '#10b981', budgetLimit: 5000 },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', iconName: 'car', color: '#3b82f6', budgetLimit: 2500 },
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', iconName: 'cart', color: '#14b8a6', budgetLimit: 4000 },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', iconName: 'bag-handle', color: '#8b5cf6', budgetLimit: 3000 },
  { id: 'cat-bills', name: 'Subscriptions & Bills', type: 'expense', iconName: 'receipt', color: '#f59e0b', budgetLimit: 3000 },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', iconName: 'film', color: '#ec4899', budgetLimit: 2000 },
  { id: 'cat-health', name: 'Health & Fitness', type: 'expense', iconName: 'fitness', color: '#06b6d4', budgetLimit: 1500 },
  { id: 'cat-income', name: 'Salary & Income', type: 'income', iconName: 'cash', color: '#10b981' }
];

const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet-main',
    name: 'CIB Prime Card',
    type: 'debit',
    balance: 14500,
    color: '#1e3a8a',
    institution: 'Commercial International Bank',
    lastFourDigits: '4821'
  },
  {
    id: 'wallet-cash',
    name: 'Cash Wallet',
    type: 'cash',
    balance: 1850,
    color: '#059669',
    institution: 'Physical Cash in Hand'
  }
];

export async function initStorage(): Promise<{
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  monthlyBudget: number;
}> {
  try {
    // 1. Categories
    let categoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    let categories: Category[];
    if (!categoriesJson) {
      categories = DEFAULT_CATEGORIES;
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } else {
      categories = JSON.parse(categoriesJson);
    }

    // 2. Wallets
    let walletsJson = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    let wallets: Wallet[];
    if (!walletsJson) {
      wallets = DEFAULT_WALLETS;
      await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    } else {
      wallets = JSON.parse(walletsJson);
      // Ensure Cash wallet exists
      if (!wallets.some((w) => w.type === 'cash' || w.id === 'wallet-cash')) {
        wallets.push(DEFAULT_WALLETS[1]);
        await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      }
    }

    // 3. Transactions
    let txJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: Transaction[] = txJson ? JSON.parse(txJson) : [];

    // 4. Monthly Budget
    let budgetStr = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_BUDGET);
    let monthlyBudget = budgetStr ? parseFloat(budgetStr) : 25000;

    return { transactions, wallets, categories, monthlyBudget };
  } catch (err) {
    console.error('Failed to init storage:', err);
    return {
      transactions: [],
      wallets: DEFAULT_WALLETS,
      categories: DEFAULT_CATEGORIES,
      monthlyBudget: 25000
    };
  }
}

export async function saveTransaction(
  tx: Omit<Transaction, 'id' | 'date' | 'currency'> & { id?: string; date?: string; currency?: string }
): Promise<Transaction> {
  const txJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  const current: Transaction[] = txJson ? JSON.parse(txJson) : [];

  const newTx: Transaction = {
    id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: tx.date || new Date().toISOString(),
    amount: tx.amount,
    currency: tx.currency || 'EGP',
    categoryId: tx.categoryId,
    walletId: tx.walletId,
    type: tx.type,
    merchant: tx.merchant || 'General Expense',
    note: tx.note || '',
    source: tx.source || 'voice'
  };

  const updated = [newTx, ...current];
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

  // Update wallet balance
  const walletsJson = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
  if (walletsJson) {
    const wallets: Wallet[] = JSON.parse(walletsJson);
    const targetWallet = wallets.find((w) => w.id === newTx.walletId);
    if (targetWallet) {
      if (newTx.type === 'expense') {
        targetWallet.balance -= newTx.amount;
      } else {
        targetWallet.balance += newTx.amount;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    }
  }

  return newTx;
}

export async function deleteTransaction(txId: string): Promise<void> {
  const txJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!txJson) return;
  const current: Transaction[] = JSON.parse(txJson);
  const found = current.find((t) => t.id === txId);
  const updated = current.filter((t) => t.id !== txId);
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));

  // Reverse wallet balance impact
  if (found) {
    const walletsJson = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
    if (walletsJson) {
      const wallets: Wallet[] = JSON.parse(walletsJson);
      const target = wallets.find((w) => w.id === found.walletId);
      if (target) {
        if (found.type === 'expense') {
          target.balance += found.amount;
        } else {
          target.balance -= found.amount;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      }
    }
  }
}

export async function updateTransaction(
  updatedTx: Transaction
): Promise<void> {
  const txJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!txJson) return;
  const current: Transaction[] = JSON.parse(txJson);
  const oldTx = current.find((t) => t.id === updatedTx.id);
  if (!oldTx) return;

  // 1. Revert old balance effect
  const walletsJson = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
  if (walletsJson) {
    const wallets: Wallet[] = JSON.parse(walletsJson);
    const oldWallet = wallets.find((w) => w.id === oldTx.walletId);
    if (oldWallet) {
      if (oldTx.type === 'expense') {
        oldWallet.balance += oldTx.amount;
      } else {
        oldWallet.balance -= oldTx.amount;
      }
    }

    // 2. Apply new balance effect
    const newWallet = wallets.find((w) => w.id === updatedTx.walletId);
    if (newWallet) {
      if (updatedTx.type === 'expense') {
        newWallet.balance -= updatedTx.amount;
      } else {
        newWallet.balance += updatedTx.amount;
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }

  // 3. Save updated transaction
  const updatedList = current.map((t) => (t.id === updatedTx.id ? updatedTx : t));
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  iconName: string;
  color: string;
  budgetLimit?: number;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'debit' | 'credit' | 'cash';
  balance: number;
  color: string;
  institution?: string;
  lastFourDigits?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  date: string;
  categoryId: string;
  walletId: string;
  type: 'expense' | 'income';
  merchant?: string;
  note?: string;
  source?: 'voice' | 'manual';
}

export interface ExtractedExpenseData {
  amount: number;
  currency: 'EGP';
  merchant: string;
  category: string;
  source: 'local_fallback';
  type?: 'expense' | 'income';
  walletHint?: string;
  confidence?: number;
}

import type { Category, Wallet } from './db';
import { parseExpenseLocally, matchCategoryToId } from './geminiParser';

export interface ParsedVoiceTransaction {
  amount: number | null;
  categoryId: string | null;
  walletId: string | null;
  type: 'expense' | 'income';
  merchant?: string;
  note: string;
  transcript: string;
}

/**
 * Matches wallet from voice transcription (Cash wallet vs bank cards)
 */
export function matchWalletFromText(
  text: string,
  wallets: Wallet[],
  defaultWalletId: string
): string {
  const norm = text.toLowerCase();
  const cashKeywords = [
    'كاش', 'cash', 'نقدا', 'نقداً', 'نقد', 'كاشات',
    'من المحفظة', 'من جيبي', 'في جيبي', 'فلوس كاش'
  ];
  const hasCashMention = cashKeywords.some((k) => norm.includes(k));
  if (hasCashMention) {
    const cashWallet = wallets.find(
      (w) => w.type === 'cash' || w.name.toLowerCase().includes('cash') || w.name.includes('كاش')
    );
    if (cashWallet) {
      return cashWallet.id;
    }
  }

  for (const w of wallets) {
    if (
      norm.includes(w.name.toLowerCase()) ||
      (w.institution && norm.includes(w.institution.toLowerCase()))
    ) {
      return w.id;
    }
  }

  return defaultWalletId;
}

/**
 * High-precision local voice parser powered by our robust local parser engine
 */
export function parseVoiceInput(
  text: string,
  categories: Category[],
  wallets: Wallet[],
  defaultWalletId: string
): ParsedVoiceTransaction {
  const cleanRaw = (text || '').trim();

  // Run our powerful local parsing engine
  const localParsed = parseExpenseLocally(cleanRaw, categories);
  const categoryId = matchCategoryToId(localParsed.category, categories);
  const walletId = matchWalletFromText(cleanRaw, wallets, defaultWalletId);

  return {
    amount: localParsed.amount || null,
    categoryId: categoryId || categories[0]?.id || null,
    walletId,
    type: localParsed.type || 'expense',
    merchant: localParsed.merchant,
    note: cleanRaw,
    transcript: cleanRaw,
  };
}

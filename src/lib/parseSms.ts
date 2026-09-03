import type { Category, Wallet } from './db';
import { classifyExpenseCategory } from './smartCategorizer';

export interface ParsedSmsResult {
  amount: number;
  merchant?: string;
  type: 'expense' | 'income' | 'transfer';
  date: string;
  walletId: string;
  categoryId: string;
  note: string;
  cardLast4?: string;
  rawText: string;
}

export function parseBankSms(
  text: string,
  categories: Category[],
  wallets: Wallet[],
  defaultWalletId: string
): ParsedSmsResult | null {
  if (!text || text.trim().length === 0) return null;

  const cleanText = text.trim();

  // 1. Extract Amount
  // e.g. "EGP 298.50", "USD 45.00", "298.50 EGP", "LE 350", "350.00 LE", "$45.00", "مبلغ 250.00 ج.م"
  let amount = 0;
  
  const amountRegexes = [
    /(?:EGP|USD|EUR|GBP|LE|L\.E|ج\.م|مبلغ|بمبلغ|قيمة|amount of|debited for|spent|purchase of|paid)\s*[:]?\s*([0-9]+(?:[,.][0-9]{1,2})?)/i,
    /([0-9]+(?:[,.][0-9]{1,2})?)\s*(?:EGP|USD|EUR|GBP|LE|L\.E|ج\.م|جنيه)/i,
    /[$€£]\s*([0-9]+(?:[,.][0-9]{1,2})?)/,
    /\b([0-9]+(?:\.[0-9]{1,2}))\b/
  ];

  for (const regex of amountRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 2. Determine Type: expense, income, transfer
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  const lowerText = cleanText.toLowerCase();

  if (
    lowerText.includes('credited') ||
    lowerText.includes('deposit') ||
    lowerText.includes('received') ||
    lowerText.includes('salary') ||
    lowerText.includes('إيداع') ||
    lowerText.includes('ايداع') ||
    lowerText.includes('تم استلام') ||
    lowerText.includes('تحويل وارد') ||
    lowerText.includes('تم شحن')
  ) {
    type = 'income';
  } else if (
    lowerText.includes('transfer to') ||
    lowerText.includes('instapay transfer') ||
    lowerText.includes('تحويل إلى') ||
    lowerText.includes('تحويل الى') ||
    lowerText.includes('تحويل صادرة')
  ) {
    type = 'transfer';
  }

  // 3. Extract Card / Account last 4 digits
  let cardLast4: string | undefined;
  const cardMatch = cleanText.match(/(?:card|بطاقة|account|ending in|ending with|\*{2,4}|بـ)\s*[:]?\s*([0-9]{4})/i);
  if (cardMatch && cardMatch[1]) {
    cardLast4 = cardMatch[1];
  }

  // 4. Match Wallet by last4 or name
  let matchedWallet = wallets.find(w => defaultWalletId && w.id === defaultWalletId);
  if (cardLast4) {
    const byLast4 = wallets.find(w => w.last4 === cardLast4);
    if (byLast4) matchedWallet = byLast4;
  }
  
  if (!matchedWallet) {
    for (const w of wallets) {
      if (lowerText.includes(w.name.toLowerCase()) || (w.institution && lowerText.includes(w.institution.toLowerCase()))) {
        matchedWallet = w;
        break;
      }
    }
  }
  const walletId = matchedWallet?.id || wallets[0]?.id || '';

  // 5. Extract Merchant (Supports English, Arabic Unicode \u0600-\u06FF, numbers, spaces)
  let merchant = '';
  const merchantRegexes = [
    /(?:purchase at|شراء لدى|شراء من)\s+([A-Za-z0-9\u0600-\u06FF\s&'-]{3,35})/i,
    /(?:at|لدى|عند|merchant|store|to\s*merchant|to\s*mcht)\s*[:]?\s*([A-Za-z0-9\u0600-\u06FF\s&'-]{3,35})(?:\s+on|\s+dated|\s+بتاريخ|\s+ref|\s+in|\s+with|\.|$)/i,
    /(?:from|من)\s+([A-Za-z0-9\u0600-\u06FF\s&'-]{3,35})/i,
    /(?:to|إلى|الي)\s+([A-Za-z0-9\u0600-\u06FF\s&'-]{3,35})/i
  ];

  for (const regex of merchantRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Avoid false positive when regex catches "card ending in..."
      if (!candidate.toLowerCase().includes('card') && !candidate.toLowerCase().includes('بطاقة')) {
        merchant = candidate;
        break;
      }
    }
  }

  // 6. Intelligent AI Classification
  const classification = classifyExpenseCategory(cleanText, merchant, categories);
  
  // Use canonical matched merchant name if detected (e.g. "Total Gas Station", "El Ezaby Pharmacy")
  const finalMerchant = classification.matchedMerchant || merchant || (type === 'income' ? 'Income Deposit' : 'Bank Purchase');
  const categoryId = classification.categoryId || categories[0]?.id || '';

  return {
    amount,
    merchant: finalMerchant,
    type,
    date: new Date().toISOString(),
    walletId,
    categoryId,
    note: `SMS: ${finalMerchant}`,
    cardLast4,
    rawText: cleanText
  };
}

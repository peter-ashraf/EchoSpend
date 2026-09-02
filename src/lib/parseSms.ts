import type { Category, Wallet } from './db';

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

  // Extract Amount: e.g. "EGP 298.50", "USD 45.00", "298.50 EGP", "LE 350", "350.00 LE", "$45.00", "مبلغ 250.00 ج.م"
  let amount = 0;
  
  // Regex for amounts with currency keywords or signs
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

  // Determine Type: expense, income, transfer
  let type: 'expense' | 'income' | 'transfer' = 'expense';
  const lowerText = cleanText.toLowerCase();

  if (
    lowerText.includes('credited') ||
    lowerText.includes('deposit') ||
    lowerText.includes('received') ||
    lowerText.includes('salary') ||
    lowerText.includes('إيداع') ||
    lowerText.includes('تم استلام') ||
    lowerText.includes('تحويل وارد') ||
    lowerText.includes('تم شحن')
  ) {
    type = 'income';
  } else if (
    lowerText.includes('transfer to') ||
    lowerText.includes('instapay transfer') ||
    lowerText.includes('تحويل إلى') ||
    lowerText.includes('تحويل صادرة')
  ) {
    type = 'transfer';
  }

  // Extract Card last 4 digits (e.g. "card ending 4521", "card 8834", "بطاقة تنتهي بـ 4521", "Venture ****4521")
  let cardLast4: string | undefined;
  const cardMatch = cleanText.match(/(?:card|بطاقة|account|ending in|ending with|\*{2,4}|بـ)\s*[:]?\s*([0-9]{4})/i);
  if (cardMatch && cardMatch[1]) {
    cardLast4 = cardMatch[1];
  }

  // Match Wallet by last4 or name
  let matchedWallet = wallets.find(w => defaultWalletId && w.id === defaultWalletId);
  if (cardLast4) {
    const byLast4 = wallets.find(w => w.last4 === cardLast4);
    if (byLast4) matchedWallet = byLast4;
  }
  
  if (!matchedWallet) {
    // Try matching bank keywords in text
    for (const w of wallets) {
      if (lowerText.includes(w.name.toLowerCase()) || (w.institution && lowerText.includes(w.institution.toLowerCase()))) {
        matchedWallet = w;
        break;
      }
    }
  }
  const walletId = matchedWallet?.id || wallets[0]?.id || '';

  // Extract Merchant: e.g. "at STARBUCKS on", "لدى كارفور في", "merchant: COPA ACAI", "to NETFLIX"
  let merchant = '';
  const merchantRegexes = [
    /(?:at|لدى|عند|merchant|store|to|to\s*merchant|to\s*mcht)\s*[:]?\s*([A-Za-z0-9\s&'-]{3,30})(?:\s+on|\s+dated|\s+بتاريخ|\s+ref|\s+in|\.|$)/i,
    /(?:purchase at|شراء لدى)\s+([A-Za-z0-9\s&'-]{3,30})/i,
    /(?:from|من)\s+([A-Za-z0-9\s&'-]{3,30})/i
  ];

  for (const regex of merchantRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      merchant = match[1].trim();
      break;
    }
  }

  // Match Category based on merchant or keywords
  let categoryId = categories[0]?.id || '';
  const merchantOrText = (merchant + ' ' + cleanText).toLowerCase();

  if (
    merchantOrText.includes('coffee') ||
    merchantOrText.includes('starbucks') ||
    merchantOrText.includes('restaurant') ||
    merchantOrText.includes('burger') ||
    merchantOrText.includes('mcdonald') ||
    merchantOrText.includes('pizza') ||
    merchantOrText.includes('food') ||
    merchantOrText.includes('cafe') ||
    merchantOrText.includes('acai') ||
    merchantOrText.includes('مطعم') ||
    merchantOrText.includes('كافيه') ||
    merchantOrText.includes('أكل')
  ) {
    const foodCat = categories.find(c => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('طعام'));
    if (foodCat) categoryId = foodCat.id;
  } else if (
    merchantOrText.includes('uber') ||
    merchantOrText.includes('careem') ||
    merchantOrText.includes('taxi') ||
    merchantOrText.includes('fuel') ||
    merchantOrText.includes('petrol') ||
    merchantOrText.includes('بنزين') ||
    merchantOrText.includes('مواصلات')
  ) {
    const transportCat = categories.find(c => c.name.toLowerCase().includes('transport') || c.name.toLowerCase().includes('مواصلات'));
    if (transportCat) categoryId = transportCat.id;
  } else if (
    merchantOrText.includes('netflix') ||
    merchantOrText.includes('spotify') ||
    merchantOrText.includes('apple') ||
    merchantOrText.includes('chatgpt') ||
    merchantOrText.includes('amazon prime') ||
    merchantOrText.includes('subscription') ||
    merchantOrText.includes('اشتراك')
  ) {
    const subCat = categories.find(c => c.name.toLowerCase().includes('sub') || c.name.toLowerCase().includes('اشتراك') || c.name.toLowerCase().includes('bill'));
    if (subCat) categoryId = subCat.id;
  } else if (
    merchantOrText.includes('zara') ||
    merchantOrText.includes('h&m') ||
    merchantOrText.includes('amazon') ||
    merchantOrText.includes('noon') ||
    merchantOrText.includes('jumia') ||
    merchantOrText.includes('mall') ||
    merchantOrText.includes('shopping') ||
    merchantOrText.includes('تسوق')
  ) {
    const shopCat = categories.find(c => c.name.toLowerCase().includes('shop') || c.name.toLowerCase().includes('تسوق'));
    if (shopCat) categoryId = shopCat.id;
  } else if (type === 'income') {
    const incomeCat = categories.find(c => c.type === 'income');
    if (incomeCat) categoryId = incomeCat.id;
  }

  return {
    amount,
    merchant: merchant || (type === 'income' ? 'Income Deposit' : 'Bank Purchase'),
    type,
    date: new Date().toISOString(),
    walletId,
    categoryId,
    note: `SMS Import: ${merchant || 'Bank Notification'}`,
    cardLast4,
    rawText: cleanText
  };
}

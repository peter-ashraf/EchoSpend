import type { Category, Wallet } from './db';
import { classifyExpenseCategory } from './smartCategorizer';

export interface ParsedVoiceTransaction {
  amount: number | null;
  categoryId: string | null;
  walletId: string | null;
  type: 'expense' | 'income';
  merchant?: string;
  note: string;
  transcript: string;
}

export function parseVoiceInput(
  text: string, 
  categories: Category[], 
  wallets: Wallet[],
  defaultWalletId: string
): ParsedVoiceTransaction {
  const cleanRaw = text.trim();
  const lowerText = cleanRaw.toLowerCase();
  
  // 1. Normalize numbers (Arabic Eastern digits to Western Arabic digits)
  const normalizedText = lowerText.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  
  // 2. Extract Amount
  let amount: number | null = null;
  
  // Try matching direct numbers in string
  const numberMatch = normalizedText.match(/(?:[$€£]|egp|le|ج\.م|جنيه|مبلغ|بـ|ب|قيمة)?\s*(\d+(?:\.\d{1,2})?)\s*(?:[$€£]|egp|le|ج\.م|جنيه|dollars|bucks)?/i);
  if (numberMatch && numberMatch[1]) {
    const parsedNum = parseFloat(numberMatch[1]);
    if (!isNaN(parsedNum) && parsedNum > 0) {
      amount = parsedNum;
    }
  }

  // If no direct digits, try word-to-number dictionary
  if (!amount) {
    const wordToNum: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'fifteen': 15, 'twenty': 20, 'twenty five': 25, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'hundred': 100, 'two hundred': 200, 'three hundred': 300, 'five hundred': 500, 'thousand': 1000,
      'واحد': 1, 'اثنين': 2, 'تلاتة': 3, 'ثلاثة': 3, 'اربعة': 4, 'أربعة': 4, 'خمسة': 5,
      'ستة': 6, 'سبعة': 7, 'تمانية': 8, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
      'خمسطاشر': 15, 'خمسة عشر': 15, 'عشرين': 20, 'خمسة وعشرين': 25, 'تلاتين': 30, 'ثلاثين': 30,
      'اربعين': 40, 'أربعين': 40, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'ثمانين': 80, 'تسعين': 90,
      'مية': 100, 'مئة': 100, 'مائة': 100, 'ميتين': 200, 'مائتين': 200, 'تلتومية': 300, 'ثلاثمائة': 300,
      'ربعمية': 400, 'خمسمية': 500, 'خمسمائة': 500, 'ستمية': 600, 'سبعمية': 700, 'تمنمية': 800, 'تسعمية': 900,
      'الف': 1000, 'ألف': 1000, 'الفين': 2000, 'ألفين': 2000, 'تلات الاف': 3000, 'خمس الاف': 5000,
      'باكو': 1000, 'باكوان': 2000, 'ارنب': 1000000
    };

    // Sort by length descending to match composite numbers like "خمسة وعشرين" before "خمسة"
    const sortedWords = Object.keys(wordToNum).sort((a, b) => b.length - a.length);
    for (const word of sortedWords) {
      if (normalizedText.includes(word)) {
        amount = wordToNum[word];
        break; 
      }
    }
  }

  // 3. Extract Type (expense vs income)
  let type: 'expense' | 'income' = 'expense';
  const incomeKeywords = ['earned', 'got paid', 'income', 'salary', 'received', 'deposit', 'راتب', 'مرتب', 'دخل', 'استلمت', 'كسبت', 'قبضت', 'تحويل وارد', 'جالي'];
  if (incomeKeywords.some(kw => normalizedText.includes(kw))) {
    type = 'income';
  }

  // 4. Intelligent AI Category & Merchant Classification
  const classification = classifyExpenseCategory(cleanRaw, undefined, categories);
  const merchant = classification.matchedMerchant || (cleanRaw.length > 25 ? cleanRaw.substring(0, 25) + '...' : cleanRaw);
  const categoryId = classification.categoryId;

  // 6. Match Wallet
  let walletId = defaultWalletId;
  for (const w of wallets) {
    if (normalizedText.includes(w.name.toLowerCase()) || (w.institution && normalizedText.includes(w.institution.toLowerCase()))) {
      walletId = w.id;
      break;
    }
  }

  return {
    amount: amount || 0,
    categoryId,
    walletId,
    type,
    merchant,
    note: cleanRaw,
    transcript: cleanRaw
  };
}

import type { Category, Wallet } from './db';

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

  // 4. Extract Merchant / Place
  let merchant = '';
  const knownMerchants: Record<string, string> = {
    'starbucks': 'Starbucks',
    'ستاربكس': 'Starbucks',
    'carrefour': 'Carrefour',
    'كارفور': 'Carrefour',
    'uber': 'Uber',
    'اوبر': 'Uber',
    'أوبر': 'Uber',
    'careem': 'Careem',
    'كريم': 'Careem',
    'mcdonald': "McDonald's",
    'ماكدونالدز': "McDonald's",
    'ماك': "McDonald's",
    'zara': 'Zara',
    'زارا': 'Zara',
    'netflix': 'Netflix',
    'نتفلكس': 'Netflix',
    'spotify': 'Spotify',
    'سبوتيفاي': 'Spotify',
    'amazon': 'Amazon',
    'امازون': 'Amazon',
    'noon': 'Noon',
    'نون': 'Noon',
    'instapay': 'InstaPay Transfer',
    'انستاباي': 'InstaPay Transfer',
    'vodafone': 'Vodafone',
    'فودافون': 'Vodafone'
  };

  for (const [kw, name] of Object.entries(knownMerchants)) {
    if (normalizedText.includes(kw)) {
      merchant = name;
      break;
    }
  }

  // If no known merchant, guess from description words
  if (!merchant) {
    if (normalizedText.includes('coffee') || normalizedText.includes('قهوة') || normalizedText.includes('كافيه')) {
      merchant = 'Coffee / Cafe';
    } else if (normalizedText.includes('groceries') || normalizedText.includes('سوبرماركت') || normalizedText.includes('ماركت')) {
      merchant = 'Supermarket';
    } else if (normalizedText.includes('pharmacy') || normalizedText.includes('صيدلية') || normalizedText.includes('دوا')) {
      merchant = 'Pharmacy';
    } else if (normalizedText.includes('gas') || normalizedText.includes('بنزين') || normalizedText.includes('بنزينة')) {
      merchant = 'Gas Station';
    } else if (type === 'income') {
      merchant = 'Salary / Income';
    } else {
      merchant = cleanRaw.length > 25 ? cleanRaw.substring(0, 25) + '...' : cleanRaw;
    }
  }

  // 5. Match Category
  let categoryId: string | null = null;
  const foodKeywords = ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'coffee', 'cafe', 'eat', 'burger', 'pizza', 'acai', 'طعام', 'اكل', 'أكل', 'غدا', 'عشا', 'فطار', 'مطعم', 'كافيه', 'قهوة', 'سوبرماركت', 'دليفري'];
  const transportKeywords = ['uber', 'careem', 'taxi', 'gas', 'petrol', 'bus', 'train', 'flight', 'مواصلات', 'اوبر', 'تاكسي', 'بنزين', 'تفويلة', 'قطار', 'باص', 'مترو'];
  const shoppingKeywords = ['shopping', 'clothes', 'shoes', 'amazon', 'noon', 'zara', 'mall', 'bought', 'تسوق', 'ملابس', 'هدوم', 'لبس', 'امازون', 'نون', 'شوبينج'];
  const billKeywords = ['bill', 'rent', 'electricity', 'water', 'internet', 'subscription', 'netflix', 'spotify', 'فاتورة', 'كهربا', 'ميه', 'انترنت', 'ايجار', 'اشتراك', 'شحن'];

  for (const cat of categories) {
    const cName = cat.name.toLowerCase();
    if (type === 'income' && (cat.type === 'income' || cName.includes('salary') || cName.includes('income'))) {
      categoryId = cat.id;
      break;
    }

    if (cName.includes('food') && foodKeywords.some(k => normalizedText.includes(k))) {
      categoryId = cat.id;
      break;
    }
    if (cName.includes('transport') && transportKeywords.some(k => normalizedText.includes(k))) {
      categoryId = cat.id;
      break;
    }
    if (cName.includes('shop') && shoppingKeywords.some(k => normalizedText.includes(k))) {
      categoryId = cat.id;
      break;
    }
    if ((cName.includes('sub') || cName.includes('bill')) && billKeywords.some(k => normalizedText.includes(k))) {
      categoryId = cat.id;
      break;
    }
    if (normalizedText.includes(cName)) {
      categoryId = cat.id;
      break;
    }
  }

  if (!categoryId && categories.length > 0) {
    categoryId = type === 'income' 
      ? (categories.find(c => c.type === 'income')?.id || categories[0].id)
      : (categories.find(c => c.type === 'expense')?.id || categories[0].id);
  }

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

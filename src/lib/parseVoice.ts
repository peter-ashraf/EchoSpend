import type { Category, Wallet } from './db';

interface ParsedTransaction {
  amount: number | null;
  categoryId: string | null;
  walletId: string | null;
  type: 'expense' | 'income' | null;
  note: string;
}

export function parseVoiceInput(
  text: string, 
  categories: Category[], 
  wallets: Wallet[],
  defaultWalletId: string
): ParsedTransaction {
  const lowerText = text.toLowerCase();
  
  // 1. Extract Amount
  // Matches "$20", "20 dollars", "twenty bucks", "20.50", and Arabic equivalents like "٢٠"
  let amount: number | null = null;
  
  // Replace Arabic numerals with English numerals for parsing
  const normalizedText = lowerText.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  
  const numberMatch = normalizedText.match(/\$?(\d+(?:\.\d{1,2})?)/);
  if (numberMatch) {
    amount = parseFloat(numberMatch[1]);
  } else {
    // Attempt basic word-to-number parsing for simple amounts
    const wordToNum: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'hundred': 100,
      'واحد': 1, 'اثنين': 2, 'ثلاثة': 3, 'اربعة': 4, 'خمسة': 5,
      'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
      'عشرين': 20, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'تمانين': 80, 'تسعين': 90,
      'مئة': 100, 'ميه': 100, 'ميتين': 200, 'تلتومية': 300, 'ربعمية': 400, 'خمسمية': 500, 'ستمية': 600, 'سبعمية': 700, 'تمنمية': 800, 'تسعمية': 900,
      'الف': 1000, 'الفين': 2000, 'تلات الاف': 3000, 'اربع الاف': 4000, 'خمس الاف': 5000,
      'باكو': 1000, 'ارنب': 1000000
    };
    for (const [word, num] of Object.entries(wordToNum)) {
      if (normalizedText.includes(word)) {
        amount = num;
        break; 
      }
    }
  }

  // 2. Extract Type
  let type: 'expense' | 'income' = 'expense';
  const incomeKeywords = ['earned', 'got paid', 'income', 'راتب', 'دخل', 'استلمت', 'كسبت', 'قبضت', 'مرتبي نزل'];
  if (incomeKeywords.some(kw => normalizedText.includes(kw))) {
    type = 'income';
  }

  // 3. Extract Category (Keyword matching)
  let categoryId: string | null = null;
  
  const categoryKeywords: Record<string, string[]> = {
    'Food': ['lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'groceries', 'coffee', 'eat', 'ate', 'طعام', 'غداء', 'عشاء', 'فطور', 'مطعم', 'بقالة', 'قهوة', 'اكل', 'شرب', 'دليفري', 'طلبت'],
    'Transport': ['gas', 'uber', 'lyft', 'taxi', 'bus', 'train', 'flight', 'ticket', 'petrol', 'مواصلات', 'بنزين', 'تاكسي', 'اوبر', 'قطار', 'باص', 'ميكروباص', 'تفويلة'],
    'Shopping': ['clothes', 'amazon', 'shoes', 'mall', 'bought', 'تسوق', 'ملابس', 'امازون', 'حذاء', 'مول', 'اشتريت', 'هدوم', 'لبس', 'جزم', 'شوبينج', 'سوق'],
    'Bills': ['electric', 'water', 'internet', 'rent', 'bill', 'insurance', 'فواتير', 'كهرباء', 'ماء', 'انترنت', 'ايجار', 'فاتورة', 'تأمين', 'نت', 'كهربا', 'ميه', 'غاز', 'شحن رصيد', 'باقة'],
    'Salary': ['paycheck', 'salary', 'bonus', 'wage', 'راتب', 'معاش', 'مكافأة', 'قبضت', 'استلمت جمعية', 'مرتبي نزل']
  };

  for (const cat of categories) {
    // Check direct name match first
    if (normalizedText.includes(cat.name.toLowerCase())) {
      categoryId = cat.id;
      type = cat.type;
      break;
    }
    // Check keywords if we have them defined in our static map above for the default categories
    // (Matches both English names in DB mapped to Arabic keywords)
    const keywords = categoryKeywords[cat.name] || [];
    if (keywords.some(kw => normalizedText.includes(kw))) {
      categoryId = cat.id;
      type = cat.type;
      break;
    }
  }

  // 4. Extract Note
  const note = text;

  // 5. Wallet
  let walletId = defaultWalletId;
  for (const w of wallets) {
    if (normalizedText.includes(w.name.toLowerCase())) {
      walletId = w.id;
      break;
    }
  }

  return {
    amount,
    categoryId,
    type,
    note,
    walletId
  };
}

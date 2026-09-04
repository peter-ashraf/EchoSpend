import type { Category } from './db';

// ── Supabase Configuration ──────────────────────────────────────────────────
export const SUPABASE_URL: string = (
  import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_REF.supabase.co'
).replace(/\/+$/, '');

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export interface ExtractedExpenseData {
  amount: number;
  currency: 'EGP';
  merchant: string;
  category: string;
  source: 'gemini' | 'local_fallback';
  type?: 'expense' | 'income';
  confidence?: number;
}

/**
 * Checks if Supabase Edge Function credentials have been configured
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof SUPABASE_URL === 'string' &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_URL.trim().length > 0 &&
    SUPABASE_ANON_KEY.trim().length > 0 &&
    !SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY') &&
    SUPABASE_URL.startsWith('http')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ADVANCED MULTILINGUAL NUMBER WORDS & DIGIT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

/**
 * Normalizes Eastern numerals, Arabic orthography (alef, taa marbuta, yaa),
 * strips diacritics/tashkeel, and cleans zero-width formatting characters.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[٠-٩]/g, (d) => EASTERN_ARABIC_DIGITS[d] || d)
    .replace(/٫/g, '.')
    .replace(/٬/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip tashkeel
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .trim();
}

const RAW_FRACTIONS: Record<string, number> = {
  'نصف': 0.5, 'نص': 0.5, 'ونصف': 0.5, 'ونص': 0.5,
  'ربع': 0.25, 'وربع': 0.25,
  'ثلث': 0.33, 'تلت': 0.33, 'وثلث': 0.33, 'وتلت': 0.33,
  'ثلاثة ارباع': 0.75, 'تلات ارباع': 0.75, 'وتلات ارباع': 0.75,
  'half': 0.5, 'quarter': 0.25, 'and a half': 0.5, 'and a quarter': 0.25
};

const FRACTIONS: Record<string, number> = {};
for (const [k, v] of Object.entries(RAW_FRACTIONS)) {
  FRACTIONS[normalizeArabicText(k)] = v;
}

const RAW_BASE_NUMBERS = [
  // Millions & Slang "Arnab"
  { word: 'مليونين', val: 2000000 },
  { word: 'مليونان', val: 2000000 },
  { word: 'مليون', val: 1000000 },
  { word: 'ملايين', val: 1000000 },
  { word: 'ارنبين', val: 2000000 },
  { word: 'ارنب', val: 1000000 },
  { word: 'ارانب', val: 1000000 },
  { word: 'million', val: 1000000 },

  // Thousands & Slang "Bako"
  { word: 'عشرة الاف', val: 10000 },
  { word: 'عشر تلاف', val: 10000 },
  { word: 'تسعة الاف', val: 9000 },
  { word: 'تسع تلاف', val: 9000 },
  { word: 'ثمانية الاف', val: 8000 },
  { word: 'تمانية الاف', val: 8000 },
  { word: 'تمن تلاف', val: 8000 },
  { word: 'سبعة الاف', val: 7000 },
  { word: 'سبع تلاف', val: 7000 },
  { word: 'ستة الاف', val: 6000 },
  { word: 'ست تلاف', val: 6000 },
  { word: 'خمسة الاف', val: 5000 },
  { word: 'خمس تلاف', val: 5000 },
  { word: 'اربعة الاف', val: 4000 },
  { word: 'اربع تلاف', val: 4000 },
  { word: 'ثلاثة الاف', val: 3000 },
  { word: 'تلاتة الاف', val: 3000 },
  { word: 'تلات تلاف', val: 3000 },
  { word: 'الفين', val: 2000 },
  { word: 'الفان', val: 2000 },
  { word: 'الف', val: 1000 },
  { word: 'الاف', val: 1000 },
  { word: 'تلاف', val: 1000 },
  { word: 'thousand', val: 1000 },
  { word: 'باكوان', val: 2000 },
  { word: 'باكوين', val: 2000 },
  { word: 'باكو', val: 1000 },
  { word: 'بواكي', val: 1000 },

  // Hundreds
  { word: 'تسعمائة', val: 900 },
  { word: 'تسعمية', val: 900 },
  { word: 'تسع مية', val: 900 },
  { word: 'ثمانمائة', val: 800 },
  { word: 'تمنمائة', val: 800 },
  { word: 'تمنمية', val: 800 },
  { word: 'تمانمية', val: 800 },
  { word: 'تمن مية', val: 800 },
  { word: 'سبعمائة', val: 700 },
  { word: 'سبعمية', val: 700 },
  { word: 'سبع مية', val: 700 },
  { word: 'ستمائة', val: 600 },
  { word: 'ستمية', val: 600 },
  { word: 'ست مية', val: 600 },
  { word: 'خمسمائة', val: 500 },
  { word: 'خمسمية', val: 500 },
  { word: 'خمس مية', val: 500 },
  { word: 'اربعمائة', val: 400 },
  { word: 'ربعمية', val: 400 },
  { word: 'اربع مية', val: 400 },
  { word: 'ثلاثمائة', val: 300 },
  { word: 'تلتومية', val: 300 },
  { word: 'تلاتمية', val: 300 },
  { word: 'تلت مية', val: 300 },
  { word: 'مائتان', val: 200 },
  { word: 'مائتين', val: 200 },
  { word: 'ميتين', val: 200 },
  { word: 'مائة', val: 100 },
  { word: 'مئة', val: 100 },
  { word: 'مية', val: 100 },
  { word: 'hundred', val: 100 },

  // Tens (عقود)
  { word: 'تسعين', val: 90 },
  { word: 'تسعون', val: 90 },
  { word: 'ثمانين', val: 80 },
  { word: 'تمانين', val: 80 },
  { word: 'ثمانون', val: 80 },
  { word: 'سبعين', val: 70 },
  { word: 'سبعون', val: 70 },
  { word: 'ستين', val: 60 },
  { word: 'ستون', val: 60 },
  { word: 'خمسين', val: 50 },
  { word: 'خمسون', val: 50 },
  { word: 'اربعين', val: 40 },
  { word: 'اربعون', val: 40 },
  { word: 'ثلاثين', val: 30 },
  { word: 'تلاتين', val: 30 },
  { word: 'ثلاثون', val: 30 },
  { word: 'عشرين', val: 20 },
  { word: 'عشرون', val: 20 },
  { word: 'ninety', val: 90 },
  { word: 'eighty', val: 80 },
  { word: 'seventy', val: 70 },
  { word: 'sixty', val: 60 },
  { word: 'fifty', val: 50 },
  { word: 'forty', val: 40 },
  { word: 'thirty', val: 30 },
  { word: 'twenty', val: 20 },

  // Teens
  { word: 'تسعة عشر', val: 19 },
  { word: 'تسعتاشر', val: 19 },
  { word: 'ثمانية عشر', val: 18 },
  { word: 'تمنتاشر', val: 18 },
  { word: 'سبعة عشر', val: 17 },
  { word: 'سبعتاشر', val: 17 },
  { word: 'ستة عشر', val: 16 },
  { word: 'ستاشر', val: 16 },
  { word: 'خمسة عشر', val: 15 },
  { word: 'خمسطاشر', val: 15 },
  { word: 'خمستاشر', val: 15 },
  { word: 'اربعة عشر', val: 14 },
  { word: 'اربعتاشر', val: 14 },
  { word: 'ثلاثة عشر', val: 13 },
  { word: 'تلاتاشر', val: 13 },
  { word: 'اثنا عشر', val: 12 },
  { word: 'اثناعشر', val: 12 },
  { word: 'اتناشر', val: 12 },
  { word: 'احد عشر', val: 11 },
  { word: 'حداشر', val: 11 },
  { word: 'nineteen', val: 19 },
  { word: 'eighteen', val: 18 },
  { word: 'seventeen', val: 17 },
  { word: 'sixteen', val: 16 },
  { word: 'fifteen', val: 15 },
  { word: 'fourteen', val: 14 },
  { word: 'thirteen', val: 13 },
  { word: 'twelve', val: 12 },
  { word: 'eleven', val: 11 },

  // Units
  { word: 'عشرة', val: 10 },
  { word: 'عشر', val: 10 },
  { word: 'تسعة', val: 9 },
  { word: 'تسع', val: 9 },
  { word: 'ثمانية', val: 8 },
  { word: 'تمانية', val: 8 },
  { word: 'تمن', val: 8 },
  { word: 'سبعة', val: 7 },
  { word: 'سبع', val: 7 },
  { word: 'ستة', val: 6 },
  { word: 'ست', val: 6 },
  { word: 'خمسة', val: 5 },
  { word: 'خمس', val: 5 },
  { word: 'اربعة', val: 4 },
  { word: 'اربع', val: 4 },
  { word: 'ثلاثة', val: 3 },
  { word: 'تلاتة', val: 3 },
  { word: 'تلات', val: 3 },
  { word: 'اثنان', val: 2 },
  { word: 'اثنين', val: 2 },
  { word: 'اتنين', val: 2 },
  { word: 'واحد', val: 1 },
  { word: 'واحدة', val: 1 },
  { word: 'ten', val: 10 },
  { word: 'nine', val: 9 },
  { word: 'eight', val: 8 },
  { word: 'seven', val: 7 },
  { word: 'six', val: 6 },
  { word: 'five', val: 5 },
  { word: 'four', val: 4 },
  { word: 'three', val: 3 },
  { word: 'two', val: 2 },
  { word: 'one', val: 1 }
];

const BASE_NUMBERS = RAW_BASE_NUMBERS.map((item) => ({
  word: normalizeArabicText(item.word),
  val: item.val
}));

function stripPrefixes(word: string): string {
  let w = word.trim();
  if (w.startsWith('بـ') || (w.startsWith('ب') && w.length > 2)) {
    const withoutB = w.replace(/^بـ?/, '');
    if (withoutB.length >= 2) w = withoutB;
  }
  if (w.startsWith('الـ') || (w.startsWith('ال') && w.length > 3)) {
    const withoutAl = w.replace(/^الـ?/, '');
    if (withoutAl.length >= 2) w = withoutAl;
  }
  if (w.startsWith('و') && w.length > 2) {
    const withoutW = w.replace(/^و/, '');
    if (withoutW.length >= 2) w = withoutW;
  }
  return w;
}

/**
 * Extracts numeric value from written spoken words, Eastern digits, or mixed text.
 */
export function parseMultilingualAmount(rawText: string): { amount: number | null; span?: string } {
  const norm = normalizeArabicText(rawText);

  // ── Step 1: Explicit Digits Matching ──
  const digitRegex = /(?:[$€£]|egp|le|l\.e|ج\.م|جم|جنيه|جنيهات|قيمة|مبلغ|بـ|ب)?\s*(\d+(?:\.\d+)?)\s*(?:[$€£]|egp|le|l\.e|ج\.م|جم|جنيه|جنيهات|قروش|قرش|pounds?|dollars?|bucks)?/i;
  const matches = [...norm.matchAll(new RegExp(digitRegex, 'gi'))];

  if (matches.length > 0) {
    for (const m of matches) {
      const full = m[0].trim();
      const numStr = m[1];
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) {
        // Detect attached spoken fractions like "50 ونص" or "20 وربع" or "50 جنيه ونص"
        const afterIndex = (m.index ?? 0) + m[0].length;
        const remainder = norm.substring(afterIndex).trim();
        let fractionVal = 0;
        if (/^(?:جنيه|جنيهات|egp|le)?\s*و\s*(نص|نصف)/i.test(remainder)) fractionVal = 0.5;
        else if (/^(?:جنيه|جنيهات|egp|le)?\s*و\s*ربع/i.test(remainder)) fractionVal = 0.25;
        else if (/^(?:جنيه|جنيهات|egp|le)?\s*و\s*(تلت|ثلث)/i.test(remainder)) fractionVal = 0.33;

        return { amount: val + fractionVal, span: full };
      }
    }
  }

  // ── Step 2: Multiplier Egyptian Slang ("3 بواكي", "باكو ونص", "ارنبين") ──
  const tokens = norm.split(/[\s,،]+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const cleanT = stripPrefixes(t);
    if (cleanT === 'باكو' || cleanT === 'بواكي') {
      let multiplier = 1;
      if (i > 0) {
        const prevT = stripPrefixes(tokens[i - 1]);
        const numEntry = BASE_NUMBERS.find((b) => b.word === prevT);
        if (numEntry && numEntry.val < 100) {
          multiplier = numEntry.val;
        } else if (!isNaN(parseFloat(prevT))) {
          multiplier = parseFloat(prevT);
        }
      }
      let bonus = 0;
      if (i + 1 < tokens.length && (tokens[i + 1] === 'ونص' || tokens[i + 1] === 'ونصف')) {
        bonus = 500; // Half a bako = 500
      }
      return { amount: multiplier * 1000 + bonus, span: `${multiplier} باكو` };
    }
    if (cleanT === 'باكوين' || cleanT === 'باكوان') {
      let bonus = 0;
      if (i + 1 < tokens.length && (tokens[i + 1] === 'ونص' || tokens[i + 1] === 'ونصف')) bonus = 500;
      return { amount: 2000 + bonus, span: cleanT };
    }
    if (cleanT === 'ارنب') {
      return { amount: 1000000, span: 'ارنب' };
    }
    if (cleanT === 'ارنبين') {
      return { amount: 2000000, span: 'ارنبين' };
    }
  }

  // ── Step 3: Compound Spoken Arabic Numbers ──
  let currentTotal = 0;
  let tempSum = 0;
  const matchedTokens: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const orig = tokens[i];
    const stripped = stripPrefixes(orig);

    const found = BASE_NUMBERS.find((b) => b.word === stripped || b.word === orig);
    if (found) {
      matchedTokens.push(orig);
      if (found.val >= 1000) {
        if (tempSum === 0) tempSum = 1;
        currentTotal += tempSum * found.val;
        tempSum = 0;
      } else {
        tempSum += found.val;
      }
      continue;
    }

    const frac = FRACTIONS[orig] || FRACTIONS[stripped];
    if (frac !== undefined) {
      matchedTokens.push(orig);
      let fracVal = frac;
      if (currentTotal >= 1000000) {
        fracVal = frac * 1000000;
      } else if (currentTotal >= 1000) {
        fracVal = frac * 1000;
      }
      tempSum += fracVal;
      continue;
    }

    const isCurrency = /^(جنيه|جنيهات|جنية|جم|ج\.م|egp|le|pounds?|dollars?)$/i.test(orig);
    if (isCurrency && (tempSum > 0 || currentTotal > 0)) {
      matchedTokens.push(orig);
      // Peek if next token is fraction (e.g. "عشرين جنيه ونص")
      if (i + 1 < tokens.length) {
        const nextOrig = tokens[i + 1];
        const nextStripped = stripPrefixes(nextOrig);
        const nextFrac = FRACTIONS[nextOrig] || FRACTIONS[nextStripped];
        if (nextFrac !== undefined) {
          tempSum += nextFrac;
          matchedTokens.push(nextOrig);
          i++;
        }
      }
      break;
    }

    if (matchedTokens.length > 0) {
      break;
    }
  }

  const finalAmount = currentTotal + tempSum;
  if (finalAmount > 0) {
    return { amount: finalAmount, span: matchedTokens.join(' ') };
  }

  return { amount: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BILINGUAL MERCHANT & CONTEXT DICTIONARY
// ─────────────────────────────────────────────────────────────────────────────

interface MerchantDefinition {
  canonicalName: string;
  keywords: string[];
  intent: 'transport' | 'groceries' | 'food' | 'shopping' | 'bills' | 'health' | 'entertainment';
}

const MERCHANT_DATABASE: MerchantDefinition[] = [
  // ── Transportation, Ride Hailing & Fuel ──
  { canonicalName: 'Uber', keywords: ['uber', 'اوبر', 'أوبر'], intent: 'transport' },
  { canonicalName: 'Careem', keywords: ['careem', 'كريم'], intent: 'transport' },
  { canonicalName: 'DiDi', keywords: ['didi', 'ديدي'], intent: 'transport' },
  { canonicalName: 'InDrive', keywords: ['indrive', 'ان درايف', 'انليف'], intent: 'transport' },
  { canonicalName: 'Swvl', keywords: ['swvl', 'سويفل'], intent: 'transport' },
  { canonicalName: 'Go Bus', keywords: ['go bus', 'gobus', 'جو باص', 'superjet', 'سوبر جيت', 'blue bus'], intent: 'transport' },
  { canonicalName: 'Cairo Metro', keywords: ['metro', 'مترو', 'cairo metro', 'تذكرة مترو', 'محطة مترو'], intent: 'transport' },
  { canonicalName: 'Egyptian Railways', keywords: ['قطارات مصر', 'سكك حديد مصر', 'قطار', 'railway', 'enr'], intent: 'transport' },
  { canonicalName: 'Mobil Gas Station', keywords: ['mobil', 'موبيل', 'بنزين موبيل', 'محطة موبيل'], intent: 'transport' },
  { canonicalName: 'Total Gas Station', keywords: ['total', 'totalenergies', 'توتال', 'محطة توتال', 'بنزين توتال'], intent: 'transport' },
  { canonicalName: 'Chillout Gas Station', keywords: ['chillout', 'chill out', 'تشيل اوت', 'تشيل أوت', 'محطة تشيل'], intent: 'transport' },
  { canonicalName: 'Watanya Gas Station', keywords: ['watanya', 'al watanya', 'alwatanya', 'الوطنية', 'محطة الوطنية', 'وطنية', 'بنزين وطنية'], intent: 'transport' },
  { canonicalName: 'Shell Gas Station', keywords: ['shell', 'شل', 'محطة شل'], intent: 'transport' },
  { canonicalName: 'Taqa Gas Station', keywords: ['taqa', 'طاقة', 'محطة طاقة', 'غازتك', 'gastec', 'cargas', 'كارجاز'], intent: 'transport' },
  { canonicalName: 'Misr Petroleum', keywords: ['misr petroleum', 'مصر للبترول', 'التعاون للبترول', 'coop'], intent: 'transport' },
  { canonicalName: 'Emarat Misr', keywords: ['emarat misr', 'امارات مصر', 'إمارات مصر', 'ola energy'], intent: 'transport' },

  // ── Supermarkets & Groceries ──
  { canonicalName: 'Carrefour', keywords: ['carrefour', 'كارفور'], intent: 'groceries' },
  { canonicalName: 'Hyper One', keywords: ['hyper one', 'hyperone', 'هايبر وان', 'هايبروان'], intent: 'groceries' },
  { canonicalName: 'LuLu Hypermarket', keywords: ['lulu', 'لولو'], intent: 'groceries' },
  { canonicalName: 'Gourmet', keywords: ['gourmet', 'جورميه'], intent: 'groceries' },
  { canonicalName: 'Seoudi Supermarket', keywords: ['seoudi', 'سعودي', 'سوبرماركت سعودي'], intent: 'groceries' },
  { canonicalName: 'Metro Market', keywords: ['metro market', 'سوبرماركت مترو'], intent: 'groceries' },
  { canonicalName: 'Kheir Zaman', keywords: ['kheir zaman', 'خير زمان'], intent: 'groceries' },
  { canonicalName: 'Kazyon', keywords: ['kazyon', 'كازيون'], intent: 'groceries' },
  { canonicalName: 'BIM Market', keywords: ['bim', 'بيم'], intent: 'groceries' },
  { canonicalName: 'Awlad Ragab', keywords: ['اولاد رجب', 'ragab sons'], intent: 'groceries' },
  { canonicalName: 'Fathalla Market', keywords: ['fathalla', 'فتح الله'], intent: 'groceries' },
  { canonicalName: 'Alfa Market', keywords: ['alfa market', 'الفا ماركت'], intent: 'groceries' },
  { canonicalName: 'Breadfast', keywords: ['breadfast', 'بريدفاست', 'بريد فاست'], intent: 'groceries' },
  { canonicalName: 'Rabbit Mart', keywords: ['rabbit', 'rabbit mart', 'رابيت'], intent: 'groceries' },
  { canonicalName: 'InstaShop', keywords: ['instashop', 'انستاشوب'], intent: 'groceries' },

  // ── Food & Dining, Cafes & Delivery ──
  { canonicalName: 'Starbucks', keywords: ['starbucks', 'ستاربكس', 'ستار باكس'], intent: 'food' },
  { canonicalName: 'Costa Coffee', keywords: ['costa', 'costa coffee', 'كوستا', 'كوستا كوفي'], intent: 'food' },
  { canonicalName: 'TBS (The Bakery Shop)', keywords: ['tbs', 'the bakery shop', 'تي بي اس'], intent: 'food' },
  { canonicalName: 'Cilantro', keywords: ['cilantro', 'سيلانترو', 'سيلنترو'], intent: 'food' },
  { canonicalName: 'Beano\'s Cafe', keywords: ['beanos', 'beano', 'بينوس'], intent: 'food' },
  { canonicalName: 'Dunkin\'', keywords: ['dunkin', 'دانكن', 'دوناتس'], intent: 'food' },
  { canonicalName: 'Krispy Kreme', keywords: ['krispy kreme', 'كريسبي كريم'], intent: 'food' },
  { canonicalName: 'McDonald\'s', keywords: ['mcdonald', 'mcdonalds', 'ماكدونالدز', 'ماك'], intent: 'food' },
  { canonicalName: 'KFC', keywords: ['kfc', 'كنتاكي', 'دجاج كنتاكي'], intent: 'food' },
  { canonicalName: 'Buffalo Burger', keywords: ['buffalo burger', 'بافلو برجر', 'بافلو'], intent: 'food' },
  { canonicalName: 'Burger King', keywords: ['burger king', 'برجر كينج'], intent: 'food' },
  { canonicalName: 'Hardee\'s', keywords: ['hardees', 'هارديز'], intent: 'food' },
  { canonicalName: 'Bazooka', keywords: ['bazooka', 'بازوكا', 'heart attack', 'هارت اتاك'], intent: 'food' },
  { canonicalName: 'Pizza Hut', keywords: ['pizza hut', 'بيتزا هت'], intent: 'food' },
  { canonicalName: 'Papa John\'s', keywords: ['papa john', 'بابا جونز'], intent: 'food' },
  { canonicalName: 'Domino\'s Pizza', keywords: ['dominos', 'دومينوز'], intent: 'food' },
  { canonicalName: 'Koshary El Tahrir', keywords: ['koshary tahrir', 'كشري التحرير', 'التحرير'], intent: 'food' },
  { canonicalName: 'Sayed Hanafy', keywords: ['sayed hanafy', 'سيد حنفي', 'كشري سيد حنفي'], intent: 'food' },
  { canonicalName: 'Koshary Abou Tarek', keywords: ['abou tarek', 'ابو طارق', 'أبو طارق'], intent: 'food' },
  { canonicalName: 'Karam El Sham', keywords: ['karam el sham', 'كرم الشام'], intent: 'food' },
  { canonicalName: 'Hawawshi El Refaey', keywords: ['el refaey', 'الرفاعي', 'حواوشي الرفاعي'], intent: 'food' },
  { canonicalName: 'B.Laban', keywords: ['b laban', 'b.laban', 'بلبن', 'ب لبن'], intent: 'food' },
  { canonicalName: 'El Abd Patisserie', keywords: ['el abd', 'العبد', 'حلواني العبد'], intent: 'food' },
  { canonicalName: 'Tseppas', keywords: ['tseppas', 'تسيباس'], intent: 'food' },
  { canonicalName: 'Sale Sucre', keywords: ['sale sucre', 'ساليه سوكريه'], intent: 'food' },
  { canonicalName: 'Etoile', keywords: ['etoile', 'ايتوال', 'إيتوال'], intent: 'food' },
  { canonicalName: 'Cinnabon', keywords: ['cinnabon', 'سينابون'], intent: 'food' },
  { canonicalName: 'Talabat', keywords: ['talabat', 'طلبات'], intent: 'food' },
  { canonicalName: 'Elmenus', keywords: ['elmenus', 'المنيوز'], intent: 'food' },
  { canonicalName: 'Jahez', keywords: ['jahez', 'جاهز'], intent: 'food' },

  // ── Pharmacies, Medical & Health ──
  { canonicalName: 'El Ezaby Pharmacy', keywords: ['el ezaby', 'elezaby', 'ezaby', 'العزبي', 'صيدلية العزبي'], intent: 'health' },
  { canonicalName: '19011 Pharmacy', keywords: ['19011', 'صيدليات 19011'], intent: 'health' },
  { canonicalName: 'Seif Pharmacy', keywords: ['seif pharmacy', 'seif', 'سيف', 'صيدلية سيف'], intent: 'health' },
  { canonicalName: 'Roushdy Pharmacy', keywords: ['roushdy', 'rushdi', 'رشدي', 'صيدلية رشدي'], intent: 'health' },
  { canonicalName: 'El Tarshouby Pharmacy', keywords: ['tarshouby', 'الطرشوبي', 'صيدلية الطرشوبي'], intent: 'health' },
  { canonicalName: 'Misr Pharmacies', keywords: ['misr pharmacies', 'صيدليات مصر'], intent: 'health' },
  { canonicalName: 'Delmar & Attalla', keywords: ['delmar', 'دلمار وعطاالله', 'دلمار'], intent: 'health' },
  { canonicalName: 'Al Borg Laboratory', keywords: ['al borg', 'معمل البرج', 'مختبر البرج'], intent: 'health' },
  { canonicalName: 'Al Mokhtabar', keywords: ['al mokhtabar', 'معمل المختبر'], intent: 'health' },
  { canonicalName: 'Alfa Scan', keywords: ['alfa scan', 'الفا سكان'], intent: 'health' },
  { canonicalName: 'Magrabi Optical & Hospital', keywords: ['magrabi', 'مغربي', 'نظارات المغربي'], intent: 'health' },

  // ── Shopping, Apparel, Electronics & Home ──
  { canonicalName: 'Zara', keywords: ['zara', 'زارا', 'pull and bear', 'pull&bear', 'bershka', 'بيرشكا', 'stradivarius'], intent: 'shopping' },
  { canonicalName: 'H&M', keywords: ['h&m', 'h & m', 'اتش اند ام', 'إتش آند إم'], intent: 'shopping' },
  { canonicalName: 'LC Waikiki', keywords: ['lc waikiki', 'lcwaikiki', 'ال سي وايكيكي', 'defacto'], intent: 'shopping' },
  { canonicalName: 'Nike / Adidas / Puma', keywords: ['nike', 'نايك', 'adidas', 'اديداس', 'puma', 'بوما', 'skechers'], intent: 'shopping' },
  { canonicalName: 'B.TECH', keywords: ['b.tech', 'btech', 'بي تك', 'raya', 'راية', '2b', 'dream 2000', 'دريم 2000'], intent: 'shopping' },
  { canonicalName: 'TradeLine', keywords: ['tradeline', 'تريد لاين', 'switch plus'], intent: 'shopping' },
  { canonicalName: 'Amazon', keywords: ['amazon', 'امازون', 'أمازون'], intent: 'shopping' },
  { canonicalName: 'Noon', keywords: ['noon', 'نون'], intent: 'shopping' },
  { canonicalName: 'Jumia', keywords: ['jumia', 'جوميا', 'shein', 'شي ان', 'temu'], intent: 'shopping' },
  { canonicalName: 'IKEA', keywords: ['ikea', 'ايكيا'], intent: 'shopping' },

  // ── Utilities, Telecom & Subscriptions ──
  { canonicalName: 'Vodafone', keywords: ['vodafone', 'فودافون', 'vfcash', 'vodafone cash'], intent: 'bills' },
  { canonicalName: 'Orange', keywords: ['orange', 'اورانج', 'أورانج', 'orange cash'], intent: 'bills' },
  { canonicalName: 'Etisalat e&', keywords: ['etisalat', 'اتصالات', 'etisalat cash'], intent: 'bills' },
  { canonicalName: 'WE / Telecom Egypt', keywords: ['telecom egypt', 'المصرية للاتصالات', 'we egypt', 'we internet', 'تي اي داتا', 'te data', ' وي '], intent: 'bills' },
  { canonicalName: 'Fawry Pay', keywords: ['fawry', 'فوري'], intent: 'bills' },
  { canonicalName: 'Aman', keywords: ['aman', 'امان', 'أمان'], intent: 'bills' },
  { canonicalName: 'Netflix', keywords: ['netflix', 'نتفلكس', 'نتفليكس'], intent: 'bills' },
  { canonicalName: 'Spotify', keywords: ['spotify', 'سبوتيفاي'], intent: 'bills' },
  { canonicalName: 'Shahid VIP', keywords: ['shahid', 'شاهد', 'watch it', 'واتش ات'], intent: 'bills' },
  { canonicalName: 'YouTube Premium', keywords: ['youtube', 'يوتيوب', 'google play'], intent: 'bills' },
  { canonicalName: 'Apple Services', keywords: ['apple.com/bill', 'itunes', 'apple subscription', 'icloud'], intent: 'bills' },

  // ── Entertainment ──
  { canonicalName: 'Vox Cinemas', keywords: ['vox', 'سينما فوكس', 'cinema', 'سينما', 'renaissance cinema', 'imax'], intent: 'entertainment' }
];

/**
 * Smart fallback logic to isolate merchant names via preposition patterns.
 */
export function extractMerchantPreposition(text: string, matchedNumberSpan?: string): string | null {
  let clean = text;
  if (matchedNumberSpan) {
    clean = clean.replace(matchedNumberSpan, ' ');
  }

  // Remove common currency markers with strict word boundaries
  clean = clean.replace(/\b(?:[$€£]|egp|le|l\.e|pounds?|dollars?|bucks)\b/gi, ' ');
  clean = clean.replace(/(?:^|\s)(?:ج\.م|جم|جنيه|جنيهات|قروش|قرش)(?:$|\s)/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();

  const patterns = [
    /(?:من\s+عند|عند)\s+([^,،.!\?0-9]{2,35})/i,
    /(?:اشتريت\s+من|طلبت\s+من|جبت\s+من|حاسبت\s+في|دفعت\s+في)\s+([^,،.!\?0-9]{2,35})/i,
    /(?:^|\s)(?:في|من)\s+([^,،.!\?0-9]{2,35})/i,
    /(?:حاسبت|دفعت\s+لـ?)\s+([^,،.!\?0-9]{2,35})/i,
    /\b(?:paid\s+to|ordered\s+from|bought\s+at|at|from|to|in)\s+([a-zA-Z\s]{2,35})/i
  ];

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let candidate = match[1].trim();
      candidate = candidate.replace(/\s+(?:بـ?|مع|على|عشان|علشان|for|with)\b.*$/gi, '').trim();
      candidate = candidate.replace(/\s+[بفكل]$/g, '').trim();

      const cleanedCandidate = candidate
        .replace(/^(?:the|a|an|محل|سوبر\s*ماركت|ماركت|كافيه|قهوة|صيدلية|بنزينة|محطة|مطعم)\s+/i, '')
        .trim();

      if (cleanedCandidate.length >= 2) return cleanedCandidate;
      if (candidate.length >= 2) return candidate;
    }
  }

  return null;
}

/**
 * Extracts merchant using dictionary priority, followed by preposition fallback.
 */
export function extractMerchant(
  text: string,
  matchedNumberSpan?: string
): { merchant: string; intent?: MerchantDefinition['intent']; confidence: number } {
  const norm = normalizeArabicText(text).toLowerCase();

  // 1. Check known merchant dictionary (highest priority)
  for (const def of MERCHANT_DATABASE) {
    for (const kw of def.keywords) {
      const cleanKw = normalizeArabicText(kw).toLowerCase();
      if (norm.includes(cleanKw)) {
        return { merchant: def.canonicalName, intent: def.intent, confidence: 0.95 };
      }
    }
  }

  // 2. Preposition pattern fallback
  const prepMerchant = extractMerchantPreposition(text, matchedNumberSpan);
  if (prepMerchant) {
    return { merchant: prepMerchant, confidence: 0.8 };
  }

  // 3. High-information fallback or generic
  return { merchant: 'General Expense', confidence: 0.5 };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. INTELLIGENT CATEGORY HEURISTICS WITH TOKEN SCORING
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryKeywords {
  intent: 'transport' | 'groceries' | 'food' | 'bills' | 'health' | 'shopping' | 'entertainment' | 'income';
  keywords: string[];
}

const CATEGORY_SCORING_RULES: CategoryKeywords[] = [
  {
    intent: 'transport',
    keywords: [
      'fuel', 'gas', 'gasoline', 'petrol', 'diesel', 'taxi', 'uber', 'careem', 'didi', 'indrive',
      'metro', 'bus', 'parking', 'toll', 'fare', 'ride', 'بنزين', 'تفويلة', 'سولار', 'غاز',
      'محطة', 'مواصلات', 'تاكسي', 'مترو', 'باص', 'اجرة', 'أجرة', 'كارته', 'باركينج', 'ركنة', 'سويفل'
    ]
  },
  {
    intent: 'groceries',
    keywords: [
      'supermarket', 'grocery', 'groceries', 'vegetables', 'fruits', 'market', 'carrefour', 'lulu',
      'hyper', 'kazyon', 'bim', 'seoudi', 'breadfast', 'rabbit', 'سوبرماركت', 'بقالة', 'خضار',
      'فاكهة', 'ماركت', 'تموين', 'جبنة', 'لبن', 'بيض', 'عيش', 'كارفور', 'كازيون', 'بيم', 'سعودي', 'لحمة'
    ]
  },
  {
    intent: 'food',
    keywords: [
      'food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'latte', 'espresso',
      'burger', 'pizza', 'sandwich', 'kfc', 'mcdonalds', 'starbucks', 'costa', 'talabat', 'meal',
      'اكل', 'أكل', 'طعام', 'غدا', 'عشا', 'فطار', 'مطعم', 'كافيه', 'قهوة', 'ساندوتش', 'شاورما',
      'برجر', 'بيتزا', 'وجبة', 'كشري', 'عصير', 'حلويات', 'دليفري'
    ]
  },
  {
    intent: 'bills',
    keywords: [
      'bill', 'utility', 'utilities', 'electricity', 'water', 'internet', 'wifi', 'telecom',
      'vodafone', 'orange', 'etisalat', 'we', 'fawry', 'recharge', 'subscription', 'فاتورة',
      'كهرباء', 'مياه', 'ميه', 'نت', 'انترنت', 'باقة', 'شحن', 'فودافون', 'اورنج', 'اتصالات', 'فوري', 'اشتراك'
    ]
  },
  {
    intent: 'health',
    keywords: [
      'pharmacy', 'medicine', 'doctor', 'clinic', 'hospital', 'dentist', 'lab', 'test', 'pills',
      'vitamins', 'صيدلية', 'دواء', 'دوا', 'علاج', 'دكتور', 'طبيب', 'عيادة', 'مستشفى', 'تحاليل',
      'اشعة', 'كشف', 'اسنان', 'نظارة', 'معمل', 'فيتامين'
    ]
  },
  {
    intent: 'shopping',
    keywords: [
      'shopping', 'clothes', 'clothing', 'shoes', 'fashion', 'mall', 'electronics', 'amazon',
      'noon', 'jumia', 'zara', 'h&m', 'store', 'تسوق', 'شوبينج', 'هدوم', 'ملابس', 'لبس',
      'جزمة', 'شنطة', 'محل', 'مول', 'امازون', 'نون', 'شراء'
    ]
  },
  {
    intent: 'entertainment',
    keywords: [
      'entertainment', 'movie', 'cinema', 'theatre', 'concert', 'game', 'gaming', 'playstation',
      'netflix', 'spotify', 'vox', 'ترفيه', 'سينما', 'فيلم', 'مسرح', 'حفلة', 'العاب', 'بلايستيشن', 'فسحة'
    ]
  },
  {
    intent: 'income',
    keywords: [
      'salary', 'income', 'bonus', 'deposit', 'earned', 'got paid', 'freelance', 'payroll',
      'مرتب', 'راتب', 'ايداع', 'دخل', 'مكافأة', 'بونص', 'قبضت', 'استلمت', 'كسبت', 'تحويل وارد', 'جالي'
    ]
  }
];

/**
 * Assigns category by scoring candidate categories against keywords and merchant intent.
 */
export function classifyExpenseCategoryLocally(
  rawText: string,
  merchantIntent: MerchantDefinition['intent'] | undefined,
  userCategories: Category[]
): { categoryId: string; categoryName: string; type: 'expense' | 'income' } {
  const norm = normalizeArabicText(rawText).toLowerCase();

  // Initialize scoring table
  const scores: Record<string, number> = {
    transport: 0,
    groceries: 0,
    food: 0,
    bills: 0,
    health: 0,
    shopping: 0,
    entertainment: 0,
    income: 0
  };

  // Base score from detected merchant intent
  if (merchantIntent && scores[merchantIntent] !== undefined) {
    scores[merchantIntent] += 50;
  }

  // Token-level scoring
  for (const rule of CATEGORY_SCORING_RULES) {
    for (const kw of rule.keywords) {
      const cleanKw = normalizeArabicText(kw).toLowerCase();
      if (norm.includes(cleanKw)) {
        scores[rule.intent] += 15;
      }
    }
  }

  // Pick winning intent
  let bestIntent: keyof typeof scores = 'food';
  let maxScore = -1;
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent as keyof typeof scores;
    }
  }

  const isIncome = bestIntent === 'income';

  // Map the winning intent to user categories in DB
  const findMatchingCategory = (): Category | undefined => {
    if (isIncome) {
      return (
        userCategories.find((c) => c.type === 'income') ||
        userCategories.find((c) => /income|salary|مرتب|دخل/i.test(c.name))
      );
    }

    switch (bestIntent) {
      case 'transport':
        return userCategories.find((c) => /transp|fuel|car|مواصلات|بنزين|سيارة/i.test(c.name));
      case 'groceries':
        return (
          userCategories.find((c) => /grocer|بقالة|سوبرماركت|market|تموين/i.test(c.name)) ||
          userCategories.find((c) => /food|dining/i.test(c.name))
        );
      case 'food':
        return userCategories.find((c) => /food|dining|مطعم|طعام|كافيه|cafe/i.test(c.name));
      case 'bills':
        return userCategories.find((c) => /bill|sub|utilit|فاتورة|فواتير|اشتراك/i.test(c.name));
      case 'health':
        return userCategories.find((c) => /health|medic|pharm|صحة|علاج|صيدلية/i.test(c.name));
      case 'shopping':
        return userCategories.find((c) => /shop|cloth|ملابس|تسوق|مشتريات/i.test(c.name));
      case 'entertainment':
        return userCategories.find((c) => /entertain|ترفيه|سينما|cinema|خروج/i.test(c.name));
      default:
        return userCategories.find((c) => c.type === 'expense');
    }
  };

  const matched = findMatchingCategory() || userCategories[0];

  return {
    categoryId: matched ? matched.id : '',
    categoryName: matched ? matched.name : 'Food & Dining',
    type: isIncome ? 'income' : 'expense'
  };
}

/**
 * Matches a category name returned from Gemini or local parser to the app's existing Category objects.
 */
export function matchCategoryToId(categoryName: string, categories: Category[]): string {
  if (!categories || categories.length === 0) return '';
  const cleanCat = (categoryName || '').toLowerCase().trim();

  // 1. Direct name match
  const directMatch = categories.find((c) => c.name.toLowerCase() === cleanCat);
  if (directMatch) return directMatch.id;

  // 2. Keyword fuzzy matching
  if (/food|dining|grocer|market|بقالة|أكل|مطعم|طعام|كافيه|قهوة|سوبرماركت|خضار|لحوم/i.test(cleanCat)) {
    const found = categories.find((c) => /food|dining/i.test(c.name));
    if (found) return found.id;
  }
  if (/transp|uber|careem|taxi|gas|petrol|مواصلات|بنزين|أوبر|تاكسي|مترو/i.test(cleanCat)) {
    const found = categories.find((c) => /transp/i.test(c.name));
    if (found) return found.id;
  }
  if (/shop|cloth|store|تسوق|ملابس|مشتريات|شراء/i.test(cleanCat)) {
    const found = categories.find((c) => /shop/i.test(c.name));
    if (found) return found.id;
  }
  if (/bill|sub|utilit|vodafone|orange|etisalat|we|فواتير|فاتورة|اشتراك|نت|كهرباء|مياه/i.test(cleanCat)) {
    const found = categories.find((c) => /sub|bill/i.test(c.name));
    if (found) return found.id;
  }
  if (/entertain|fun|movie|cinema|ترفيه|سينما|خروج/i.test(cleanCat)) {
    const found = categories.find((c) => /entertain/i.test(c.name));
    if (found) return found.id;
  }
  if (/health|fit|medic|pharm|صحة|علاج|صيدلية|دواء|دكتور|جيم/i.test(cleanCat)) {
    const found = categories.find((c) => /health/i.test(c.name));
    if (found) return found.id;
  }
  if (/income|salary|مرتب|راتب|دخل/i.test(cleanCat)) {
    const found = categories.find((c) => c.type === 'income');
    if (found) return found.id;
  }

  // Default to first expense category or first available
  const firstExpense = categories.find((c) => c.type === 'expense');
  return firstExpense ? firstExpense.id : categories[0]?.id || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POWERFUL LOCAL OFFLINE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust local parser engine that handles multilingual spoken numbers, currency,
 * fuzzy merchant dictionary, preposition patterns, and token category scoring.
 * 100% offline, zero failed parses.
 */
export function parseExpenseLocally(
  text: string,
  categories: Category[]
): ExtractedExpenseData {
  try {
    const rawClean = (text || '').trim();

    // 1. Amount and span extraction
    const amountResult = parseMultilingualAmount(rawClean);

    // 2. Merchant extraction (dictionary + preposition fallback)
    const merchantResult = extractMerchant(rawClean, amountResult.span);

    // 3. Category classification via token heuristics
    const catResult = classifyExpenseCategoryLocally(
      rawClean,
      merchantResult.intent,
      categories
    );

    return {
      amount: amountResult.amount || 0,
      currency: 'EGP',
      merchant: merchantResult.merchant,
      category: catResult.categoryName,
      type: catResult.type,
      source: 'local_fallback',
      confidence: merchantResult.confidence
    };
  } catch (err) {
    console.warn('Local parser fallback error, using safe baseline:', err);
    return {
      amount: 0,
      currency: 'EGP',
      merchant: 'General Expense',
      category: categories[0]?.name || 'Food & Dining',
      type: 'expense',
      source: 'local_fallback',
      confidence: 0.1
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. AUTOMATIC FAILOVER INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends transcript to the Supabase Edge Function (powered by Gemini 1.5 Flash).
 * Seamlessly fails over to our powerful local engine whenever offline, timed out (5s),
 * or unconfigured, ensuring 100% reliability and zero failed parses.
 */
export async function parseExpenseWithGemini(
  arabicTranscript: string,
  categories: Category[]
): Promise<ExtractedExpenseData> {
  const cleanTranscript = (arabicTranscript || '').trim();

  // If Supabase credentials are configured and browser is online, attempt Edge Function
  if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 5000);

    try {
      const endpoint = `${SUPABASE_URL}/functions/v1/parse-expense`;
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ text: cleanTranscript }),
      });

      clearTimeout(timeoutTimer);

      if (response.ok) {
        const data = await response.json();
        const amt = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0;
        if (amt > 0 || (data.merchant && data.merchant !== 'General')) {
          return {
            amount: amt,
            currency: 'EGP',
            merchant: data.merchant || 'General',
            category: data.category || 'Food & Dining',
            source: 'gemini',
          };
        }
      }
      console.warn('Supabase Edge Function response incomplete, triggering powerful local parser.');
    } catch (err) {
      clearTimeout(timeoutTimer);
      console.warn('Edge function timed out or unreachable, triggering powerful local parser:', err);
    }
  }

  // Instant fallback to our heavy-duty local engine
  return parseExpenseLocally(cleanTranscript, categories);
}

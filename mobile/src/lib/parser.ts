import type { Category, Wallet } from './types';

// ── Eastern Arabic Numerals & Orthography Normalization ──────────────────────
const EASTERN_ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

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

  // Tens
  { word: 'تسعين', val: 90 }, { word: 'تسعون', val: 90 },
  { word: 'ثمانين', val: 80 }, { word: 'تمانين', val: 80 }, { word: 'ثمانون', val: 80 },
  { word: 'سبعين', val: 70 }, { word: 'سبعون', val: 70 },
  { word: 'ستين', val: 60 }, { word: 'ستون', val: 60 },
  { word: 'خمسين', val: 50 }, { word: 'خمسون', val: 50 },
  { word: 'اربعين', val: 40 }, { word: 'اربعون', val: 40 },
  { word: 'ثلاثين', val: 30 }, { word: 'تلاتين', val: 30 }, { word: 'ثلاثون', val: 30 },
  { word: 'عشرين', val: 20 }, { word: 'عشرون', val: 20 },
  { word: 'ninety', val: 90 }, { word: 'eighty', val: 80 },
  { word: 'seventy', val: 70 }, { word: 'sixty', val: 60 },
  { word: 'fifty', val: 50 }, { word: 'forty', val: 40 },
  { word: 'thirty', val: 30 }, { word: 'twenty', val: 20 },

  // Teens
  { word: 'تسعة عشر', val: 19 }, { word: 'تسعتاشر', val: 19 },
  { word: 'ثمانية عشر', val: 18 }, { word: 'تمنتاشر', val: 18 },
  { word: 'سبعة عشر', val: 17 }, { word: 'سبعتاشر', val: 17 },
  { word: 'ستة عشر', val: 16 }, { word: 'ستاشر', val: 16 },
  { word: 'خمسة عشر', val: 15 }, { word: 'خمسطاشر', val: 15 }, { word: 'خمستاشر', val: 15 },
  { word: 'اربعة عشر', val: 14 }, { word: 'اربعتاشر', val: 14 },
  { word: 'ثلاثة عشر', val: 13 }, { word: 'تلاتاشر', val: 13 },
  { word: 'اثنا عشر', val: 12 }, { word: 'اثناعشر', val: 12 }, { word: 'اتناشر', val: 12 },
  { word: 'احد عشر', val: 11 }, { word: 'حداشر', val: 11 },
  { word: 'nineteen', val: 19 }, { word: 'eighteen', val: 18 },
  { word: 'seventeen', val: 17 }, { word: 'sixteen', val: 16 },
  { word: 'fifteen', val: 15 }, { word: 'fourteen', val: 14 },
  { word: 'thirteen', val: 13 }, { word: 'twelve', val: 12 }, { word: 'eleven', val: 11 },

  // Units
  { word: 'عشرة', val: 10 }, { word: 'عشر', val: 10 },
  { word: 'تسعة', val: 9 }, { word: 'تسع', val: 9 },
  { word: 'ثمانية', val: 8 }, { word: 'تمانية', val: 8 }, { word: 'تمن', val: 8 },
  { word: 'سبعة', val: 7 }, { word: 'سبع', val: 7 },
  { word: 'ستة', val: 6 }, { word: 'ست', val: 6 },
  { word: 'خمسة', val: 5 }, { word: 'خمس', val: 5 },
  { word: 'اربعة', val: 4 }, { word: 'اربع', val: 4 },
  { word: 'ثلاثة', val: 3 }, { word: 'تلاتة', val: 3 }, { word: 'تلات', val: 3 },
  { word: 'اثنان', val: 2 }, { word: 'اثنين', val: 2 }, { word: 'اتنين', val: 2 },
  { word: 'واحد', val: 1 }, { word: 'واحدة', val: 1 },
  { word: 'ten', val: 10 }, { word: 'nine', val: 9 }, { word: 'eight', val: 8 },
  { word: 'seven', val: 7 }, { word: 'six', val: 6 }, { word: 'five', val: 5 },
  { word: 'four', val: 4 }, { word: 'three', val: 3 }, { word: 'two', val: 2 }, { word: 'one', val: 1 }
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

export function parseMultilingualAmount(rawText: string): { amount: number | null; span?: string } {
  const norm = normalizeArabicText(rawText);

  // 1. Direct digits matching
  const digitRegex = /(?:[$€£]|egp|le|l\.e|ج\.م|جم|جنيه|جنيهات|قيمة|مبلغ|بـ|ب)?\s*(\d+(?:\.\d+)?)\s*(?:[$€£]|egp|le|l\.e|ج\.م|جم|جنيه|جنيهات|قروش|قرش|pounds?|dollars?|bucks)?/i;
  const matches = [...norm.matchAll(new RegExp(digitRegex, 'gi'))];

  if (matches.length > 0) {
    for (const m of matches) {
      const full = m[0].trim();
      const numStr = m[1];
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) {
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

  // 2. Egyptian slang multiplier ("3 باكو", "باكو ونص", "ارنبين")
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
        bonus = 500;
      }
      return { amount: multiplier * 1000 + bonus, span: `${multiplier} باكو` };
    }
    if (cleanT === 'باكوين' || cleanT === 'باكوان') {
      let bonus = 0;
      if (i + 1 < tokens.length && (tokens[i + 1] === 'ونص' || tokens[i + 1] === 'ونصف')) bonus = 500;
      return { amount: 2000 + bonus, span: cleanT };
    }
    if (cleanT === 'ارنب') return { amount: 1000000, span: 'ارنب' };
    if (cleanT === 'ارنبين') return { amount: 2000000, span: 'ارنبين' };
  }

  // 3. Spoken compound numbers
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

    if (matchedTokens.length > 0) break;
  }

  const finalAmount = currentTotal + tempSum;
  if (finalAmount > 0) {
    return { amount: finalAmount, span: matchedTokens.join(' ') };
  }

  return { amount: null };
}

// ── Merchant Knowledge Base & Prepositions ───────────────────────────────────
interface MerchantDefinition {
  canonicalName: string;
  keywords: string[];
  intent: 'transport' | 'groceries' | 'food' | 'shopping' | 'bills' | 'health' | 'entertainment';
}

const MERCHANT_DATABASE: MerchantDefinition[] = [
  // Transport & Fuel
  { canonicalName: 'Uber', keywords: ['uber', 'اوبر', 'أوبر'], intent: 'transport' },
  { canonicalName: 'Careem', keywords: ['careem', 'كريم'], intent: 'transport' },
  { canonicalName: 'DiDi', keywords: ['didi', 'ديدي'], intent: 'transport' },
  { canonicalName: 'InDrive', keywords: ['indrive', 'ان درايف'], intent: 'transport' },
  { canonicalName: 'Swvl', keywords: ['swvl', 'سويفل'], intent: 'transport' },
  { canonicalName: 'Go Bus', keywords: ['go bus', 'gobus', 'جو باص'], intent: 'transport' },
  { canonicalName: 'Cairo Metro', keywords: ['metro', 'مترو'], intent: 'transport' },
  { canonicalName: 'Mobil Gas Station', keywords: ['mobil', 'موبيل', 'بنزين موبيل'], intent: 'transport' },
  { canonicalName: 'Total Gas Station', keywords: ['total', 'توتال', 'محطة توتال'], intent: 'transport' },
  { canonicalName: 'Chillout Gas Station', keywords: ['chillout', 'تشيل اوت', 'تشيل أوت'], intent: 'transport' },
  { canonicalName: 'Watanya Gas Station', keywords: ['watanya', 'الوطنية', 'وطنية'], intent: 'transport' },
  { canonicalName: 'Shell Gas Station', keywords: ['shell', 'شل'], intent: 'transport' },
  { canonicalName: 'Taqa Gas Station', keywords: ['taqa', 'طاقة', 'غازتك'], intent: 'transport' },

  // Supermarkets & Groceries
  { canonicalName: 'Carrefour', keywords: ['carrefour', 'كارفور'], intent: 'groceries' },
  { canonicalName: 'Hyper One', keywords: ['hyper one', 'هايبر وان'], intent: 'groceries' },
  { canonicalName: 'LuLu Hypermarket', keywords: ['lulu', 'لولو'], intent: 'groceries' },
  { canonicalName: 'Gourmet', keywords: ['gourmet', 'جورميه'], intent: 'groceries' },
  { canonicalName: 'Seoudi Supermarket', keywords: ['seoudi', 'سعودي'], intent: 'groceries' },
  { canonicalName: 'Metro Market', keywords: ['metro market', 'سوبرماركت مترو'], intent: 'groceries' },
  { canonicalName: 'Kheir Zaman', keywords: ['kheir zaman', 'خير زمان'], intent: 'groceries' },
  { canonicalName: 'Kazyon', keywords: ['kazyon', 'كازيون'], intent: 'groceries' },
  { canonicalName: 'BIM Market', keywords: ['bim', 'بيم'], intent: 'groceries' },
  { canonicalName: 'Breadfast', keywords: ['breadfast', 'بريدفاست'], intent: 'groceries' },
  { canonicalName: 'Rabbit Mart', keywords: ['rabbit', 'رابيت'], intent: 'groceries' },

  // Food & Dining
  { canonicalName: 'Starbucks', keywords: ['starbucks', 'ستاربكس', 'ستار باكس'], intent: 'food' },
  { canonicalName: 'Costa Coffee', keywords: ['costa', 'كوستا'], intent: 'food' },
  { canonicalName: 'TBS Bakery', keywords: ['tbs', 'تي بي اس'], intent: 'food' },
  { canonicalName: 'McDonald\'s', keywords: ['mcdonald', 'ماكدونالدز', 'ماك'], intent: 'food' },
  { canonicalName: 'KFC', keywords: ['kfc', 'كنتاكي'], intent: 'food' },
  { canonicalName: 'Buffalo Burger', keywords: ['buffalo burger', 'بافلو'], intent: 'food' },
  { canonicalName: 'Burger King', keywords: ['burger king', 'برجر كينج'], intent: 'food' },
  { canonicalName: 'Pizza Hut', keywords: ['pizza hut', 'بيتزا هت'], intent: 'food' },
  { canonicalName: 'Koshary El Tahrir', keywords: ['koshary tahrir', 'كشري التحرير', 'التحرير'], intent: 'food' },
  { canonicalName: 'Sayed Hanafy', keywords: ['sayed hanafy', 'سيد حنفي'], intent: 'food' },
  { canonicalName: 'B.Laban', keywords: ['b laban', 'b.laban', 'بلبن'], intent: 'food' },
  { canonicalName: 'El Abd Patisserie', keywords: ['el abd', 'العبد'], intent: 'food' },
  { canonicalName: 'Talabat', keywords: ['talabat', 'طلبات'], intent: 'food' },

  // Pharmacies & Health
  { canonicalName: 'El Ezaby Pharmacy', keywords: ['el ezaby', 'العزبي', 'صيدلية العزبي'], intent: 'health' },
  { canonicalName: '19011 Pharmacy', keywords: ['19011', 'صيدليات 19011'], intent: 'health' },
  { canonicalName: 'Seif Pharmacy', keywords: ['seif pharmacy', 'سيف'], intent: 'health' },
  { canonicalName: 'Al Borg Lab', keywords: ['al borg', 'معمل البرج'], intent: 'health' },
  { canonicalName: 'Al Mokhtabar', keywords: ['al mokhtabar', 'معمل المختبر'], intent: 'health' },

  // Shopping & Tech
  { canonicalName: 'Zara', keywords: ['zara', 'زارا', 'pull and bear'], intent: 'shopping' },
  { canonicalName: 'H&M', keywords: ['h&m', 'اتش اند ام'], intent: 'shopping' },
  { canonicalName: 'B.TECH', keywords: ['b.tech', 'بي تك', 'raya', 'راية'], intent: 'shopping' },
  { canonicalName: 'Amazon', keywords: ['amazon', 'امازون'], intent: 'shopping' },
  { canonicalName: 'Noon', keywords: ['noon', 'نون'], intent: 'shopping' },
  { canonicalName: 'IKEA', keywords: ['ikea', 'ايكيا'], intent: 'shopping' },

  // Telecom & Bills
  { canonicalName: 'Vodafone', keywords: ['vodafone', 'فودافون'], intent: 'bills' },
  { canonicalName: 'Orange', keywords: ['orange', 'اورانج', 'أورانج'], intent: 'bills' },
  { canonicalName: 'Etisalat e&', keywords: ['etisalat', 'اتصالات'], intent: 'bills' },
  { canonicalName: 'WE Telecom', keywords: ['telecom egypt', 'المصرية للاتصالات', 'we internet', ' وي '], intent: 'bills' },
  { canonicalName: 'Fawry Pay', keywords: ['fawry', 'فوري'], intent: 'bills' },
  { canonicalName: 'Netflix', keywords: ['netflix', 'نتفلكس'], intent: 'bills' },
  { canonicalName: 'Spotify', keywords: ['spotify', 'سبوتيفاي'], intent: 'bills' }
];

export function extractMerchant(
  text: string,
  matchedNumberSpan?: string
): { merchant: string; intent?: MerchantDefinition['intent']; confidence: number } {
  const norm = normalizeArabicText(text).toLowerCase();

  // 1. Dictionary check
  for (const def of MERCHANT_DATABASE) {
    for (const kw of def.keywords) {
      const cleanKw = normalizeArabicText(kw).toLowerCase();
      if (norm.includes(cleanKw)) {
        return { merchant: def.canonicalName, intent: def.intent, confidence: 0.95 };
      }
    }
  }

  // 2. Preposition extraction
  let clean = text;
  if (matchedNumberSpan) clean = clean.replace(matchedNumberSpan, ' ');
  clean = clean.replace(/\b(?:[$€£]|egp|le|l\.e|pounds?|dollars?|bucks)\b/gi, ' ');
  clean = clean.replace(/(?:^|\s)(?:ج\.م|جم|جنيه|جنيهات|قروش|قرش)(?:$|\s)/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();

  const patterns = [
    /(?:من\s+عند|عند)\s+([^,،.!?0-9]{2,35})/i,
    /(?:اشتريت\s+من|طلبت\s+من|جبت\s+من|حاسبت\s+في|دفعت\s+في)\s+([^,،.!?0-9]{2,35})/i,
    /(?:^|\s)(?:في|من)\s+([^,،.!?0-9]{2,35})/i,
    /(?:حاسبت|دفعت\s+لـ?)\s+([^,،.!?0-9]{2,35})/i,
    /\b(?:paid\s+to|ordered\s+from|bought\s+at|at|from|to|in)\s+([a-zA-Z\s]{2,35})/i
  ];

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match && match[1]) {
      let candidate = match[1].trim();
      candidate = candidate.replace(/\s+(?:بـ?|مع|على|عشان|علشان|for|with)\b.*$/gi, '').trim();
      candidate = candidate.replace(/\s+[بفكل]$/g, '').trim();
      const cleaned = candidate
        .replace(/^(?:the|a|an|محل|سوبر\s*ماركت|ماركت|كافي[ةه]|قهو[ةه]|صيدلي[ةه]|بنزين[ةه]|محط[ةه]|مطعم)\s+/i, '')
        .trim();
      if (cleaned.length >= 2) return { merchant: cleaned, confidence: 0.8 };
      if (candidate.length >= 2) return { merchant: candidate, confidence: 0.75 };
    }
  }

  return { merchant: 'General Expense', confidence: 0.5 };
}

// ── Category Heuristics ───────────────────────────────────────────────────────
export function classifyCategory(
  rawText: string,
  merchantIntent: MerchantDefinition['intent'] | undefined,
  userCategories: Category[]
): { categoryId: string; categoryName: string; type: 'expense' | 'income' } {
  const norm = normalizeArabicText(rawText).toLowerCase();

  const isIncome = /salary|income|bonus|deposit|earned|got paid|مرتب|راتب|ايداع|دخل|مكاف[اأ]ة|بونص|قبضت|استلمت|كسبت|تحويل وارد|جالي/i.test(norm);
  if (isIncome) {
    const incomeCat = userCategories.find((c) => c.type === 'income') || userCategories[0];
    return {
      categoryId: incomeCat?.id || 'cat-income',
      categoryName: incomeCat?.name || 'Salary & Income',
      type: 'income'
    };
  }

  let matchedCat: Category | undefined;
  if (merchantIntent === 'transport' || /fuel|gas|petrol|taxi|uber|careem|بنزين|مواصلات|تاكسي|مترو/i.test(norm)) {
    matchedCat = userCategories.find((c) => /transp|fuel|مواصلات|بنزين/i.test(c.name));
  } else if (merchantIntent === 'groceries' || /grocery|supermarket|سوبرماركت|بقال[ةه]|خضار|فاكه[ةه]/i.test(norm)) {
    matchedCat = userCategories.find((c) => /grocer|بقال[ةه]|سوبرماركت/i.test(c.name)) || userCategories.find((c) => /food/i.test(c.name));
  } else if (merchantIntent === 'food' || /food|dinner|lunch|breakfast|cafe|coffee|مطعم|اكل|كافي[ةه]|قهو[ةه]/i.test(norm)) {
    matchedCat = userCategories.find((c) => /food|dining|مطعم/i.test(c.name));
  } else if (merchantIntent === 'bills' || /bill|utility|recharge|فاتور[ةه]|كهرباء|مياه|نت|باق[ةه]/i.test(norm)) {
    matchedCat = userCategories.find((c) => /bill|sub|فاتور[ةه]/i.test(c.name));
  } else if (merchantIntent === 'health' || /pharmacy|medicine|doctor|clinic|صيدلي[ةه]|دواء|دوا|علاج|دكتور/i.test(norm)) {
    matchedCat = userCategories.find((c) => /health|صح[ةه]|علاج/i.test(c.name));
  } else if (merchantIntent === 'shopping' || /shop|clothes|shoes|ملابس|تسوق|هدوم/i.test(norm)) {
    matchedCat = userCategories.find((c) => /shop|تسوق/i.test(c.name));
  } else if (merchantIntent === 'entertainment' || /entertainment|movie|cinema|سينما|ترفيه/i.test(norm)) {
    matchedCat = userCategories.find((c) => /entertain|ترفيه/i.test(c.name));
  }

  const fallback = matchedCat || userCategories.find((c) => c.type === 'expense') || userCategories[0];
  return {
    categoryId: fallback?.id || '',
    categoryName: fallback?.name || 'Food & Dining',
    type: 'expense'
  };
}

export function matchWallet(
  text: string,
  wallets: Wallet[],
  defaultWalletId: string
): string {
  const norm = text.toLowerCase();
  const cashKeywords = ['كاش', 'cash', 'نقدا', 'نقداً', 'نقد', 'كاشات', 'من المحفظة', 'من جيبي', 'في جيبي', 'فلوس كاش'];
  if (cashKeywords.some((k) => norm.includes(k))) {
    const cash = wallets.find((w) => w.type === 'cash' || /cash|كاش/i.test(w.name));
    if (cash) return cash.id;
  }
  for (const w of wallets) {
    if (norm.includes(w.name.toLowerCase()) || (w.institution && norm.includes(w.institution.toLowerCase()))) {
      return w.id;
    }
  }
  return defaultWalletId;
}

export function parseExpense(
  text: string,
  categories: Category[],
  wallets: Wallet[],
  defaultWalletId: string
): {
  amount: number | null;
  merchant: string;
  categoryId: string;
  categoryName: string;
  walletId: string;
  type: 'expense' | 'income';
} {
  const clean = (text || '').trim();
  const amountRes = parseMultilingualAmount(clean);
  const merchantRes = extractMerchant(clean, amountRes.span);
  const catRes = classifyCategory(clean, merchantRes.intent, categories);
  const walletId = matchWallet(clean, wallets, defaultWalletId);

  return {
    amount: amountRes.amount,
    merchant: merchantRes.merchant,
    categoryId: catRes.categoryId,
    categoryName: catRes.categoryName,
    walletId,
    type: catRes.type
  };
}

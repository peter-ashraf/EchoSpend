import type { Category } from './db';
import { parseVoiceInput } from './parseVoice';

// ── Supabase Configuration Placeholders ─────────────────────────────
// Replace these placeholders or define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
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

/**
 * Matches a category name returned from Gemini to the app's existing Category objects
 */
export function matchCategoryToId(categoryName: string, categories: Category[]): string {
  if (!categories || categories.length === 0) return '';
  const cleanCat = (categoryName || '').toLowerCase().trim();

  // 1. Direct name match
  const directMatch = categories.find(
    (c) => c.name.toLowerCase() === cleanCat
  );
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

  // Default to first expense category or first available
  const firstExpense = categories.find((c) => c.type === 'expense');
  return firstExpense ? firstExpense.id : categories[0]?.id || '';
}

/**
 * Sends Arabic transcript to the Supabase Edge Function (parse-expense)
 * Powered by Gemini 1.5 Flash. Falls back gracefully to local parser if offline or not yet configured.
 */
export async function parseExpenseWithGemini(
  arabicTranscript: string,
  categories: Category[]
): Promise<ExtractedExpenseData> {
  const cleanTranscript = (arabicTranscript || '').trim();

  // If Supabase credentials are configured, call the Supabase Edge Function
  if (isSupabaseConfigured() && navigator.onLine) {
    try {
      const endpoint = `${SUPABASE_URL}/functions/v1/parse-expense`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ text: cleanTranscript }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
          currency: 'EGP',
          merchant: data.merchant || 'General',
          category: data.category || 'Food & Dining',
          source: 'gemini',
        };
      }
      console.warn('Supabase Edge Function error, falling back to local parser:', response.status);
    } catch (err) {
      console.warn('Failed calling parse-expense edge function:', err);
    }
  }

  // Graceful fallback to local Egyptian Arabic regex parser
  const localParsed = parseVoiceInput(cleanTranscript, categories, [], '');
  const matchedCat = categories.find((c) => c.id === localParsed.categoryId);

  return {
    amount: localParsed.amount || 0,
    currency: 'EGP',
    merchant: localParsed.merchant || 'General',
    category: matchedCat ? matchedCat.name : 'Food & Dining',
    source: 'local_fallback',
  };
}

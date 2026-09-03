import type { Category } from './db';

export interface CategoryMatchResult {
  categoryId: string;
  categoryName: string;
  matchedMerchant?: string;
  confidence: number;
  intent: 'transport' | 'health' | 'food' | 'shopping' | 'bills' | 'entertainment' | 'income' | 'general';
}

/**
 * Intelligent Merchant & Category Knowledge Base.
 * Maps known merchant keywords and aliases (English & Arabic) to financial categories.
 */
interface MerchantDefinition {
  canonicalName: string;
  keywords: string[];
  intent: 'transport' | 'health' | 'food' | 'shopping' | 'bills' | 'entertainment';
}

const MERCHANT_DATABASE: MerchantDefinition[] = [
  // ── Transportation & Fuel ──────────────────────────────────────────────────
  {
    canonicalName: 'Total Gas Station',
    keywords: ['total', 'totalenergies', 'توتال', 'محطة توتال'],
    intent: 'transport'
  },
  {
    canonicalName: 'Chillout Gas Station',
    keywords: ['chillout', 'chill out', 'تشيل اوت', 'تشيل أوت', 'محطة تشيل'],
    intent: 'transport'
  },
  {
    canonicalName: 'Watanya Gas Station',
    keywords: ['watanya', 'al watanya', 'alwatanya', 'الوطنية', 'محطة الوطنية', 'وطنية'],
    intent: 'transport'
  },
  {
    canonicalName: 'Mobil Gas Station',
    keywords: ['mobil', 'exxonmobil', 'موبيل', 'محطة موبيل'],
    intent: 'transport'
  },
  {
    canonicalName: 'Shell Gas Station',
    keywords: ['shell', 'شل', 'محطة شل'],
    intent: 'transport'
  },
  {
    canonicalName: 'Misr Petroleum',
    keywords: ['misr petroleum', 'مصر للبترول', 'التعاون للبترول', 'coop'],
    intent: 'transport'
  },
  {
    canonicalName: 'Taqa Gas Station',
    keywords: ['taqa', 'طاقة', 'محطة طاقة', 'غازتك', 'gastec', 'cargas', 'كارجاز'],
    intent: 'transport'
  },
  {
    canonicalName: 'Emarat Misr',
    keywords: ['emarat misr', 'امارات مصر', 'إمارات مصر', 'ola energy', 'أولى للطاقة'],
    intent: 'transport'
  },
  {
    canonicalName: 'Uber',
    keywords: ['uber', 'اوبر', 'أوبر'],
    intent: 'transport'
  },
  {
    canonicalName: 'Careem',
    keywords: ['careem', 'كريم'],
    intent: 'transport'
  },
  {
    canonicalName: 'DiDi',
    keywords: ['didi', 'ديدي'],
    intent: 'transport'
  },
  {
    canonicalName: 'InDrive',
    keywords: ['indrive', 'ان درايف', 'انليف'],
    intent: 'transport'
  },
  {
    canonicalName: 'Swvl',
    keywords: ['swvl', 'سويفل'],
    intent: 'transport'
  },
  {
    canonicalName: 'Go Bus',
    keywords: ['go bus', 'gobus', 'جو باص', 'superjet', 'سوبر جيت', 'blue bus'],
    intent: 'transport'
  },
  {
    canonicalName: 'Cairo Metro / Railway',
    keywords: ['metro', 'مترو', 'cairo metro', 'قطارات مصر', 'سكك حديد مصر', 'enr', 'railway'],
    intent: 'transport'
  },

  // ── Health, Pharmacy & Medical ─────────────────────────────────────────────
  {
    canonicalName: 'El Ezaby Pharmacy',
    keywords: ['el ezaby', 'elezaby', 'ezaby', 'العزبي', 'صيدلية العزبي', 'صيدليات العزبي'],
    intent: 'health'
  },
  {
    canonicalName: '19011 Pharmacy',
    keywords: ['19011', 'صيدليات 19011'],
    intent: 'health'
  },
  {
    canonicalName: 'Seif Pharmacy',
    keywords: ['seif pharmacy', 'seif', 'سيف', 'صيدلية سيف', 'صيدليات سيف'],
    intent: 'health'
  },
  {
    canonicalName: 'Care Pharmacy',
    keywords: ['care pharmacy', 'صيدلية كير', 'كير'],
    intent: 'health'
  },
  {
    canonicalName: 'Roushdy Pharmacy',
    keywords: ['roushdy', 'rushdi', 'رشدي', 'صيدلية رشدي'],
    intent: 'health'
  },
  {
    canonicalName: 'Dr. M Pharmacy',
    keywords: ['dr m', 'dr. m', 'دكتور ام', 'دكتور إم'],
    intent: 'health'
  },
  {
    canonicalName: 'Misr Pharmacies',
    keywords: ['misr pharmacies', 'صيدليات مصر', 'el tarshoby', 'الطرشوبي', 'we care pharmacy'],
    intent: 'health'
  },
  {
    canonicalName: 'Al Borg Laboratory',
    keywords: ['al borg', 'el borg', 'معمل البرج', 'مختبر البرج', 'al mokhtabar', 'معمل المختبر', 'alfa scan', 'الفا سكان', 'alfa lab', 'معمل الفا'],
    intent: 'health'
  },
  {
    canonicalName: 'Magrabi Optical & Hospital',
    keywords: ['magrabi', 'مغربي', 'نظارات المغربي', 'بركات', 'barakat optics', 'ciba vision'],
    intent: 'health'
  },

  // ── Food & Dining / Cafes / Supermarkets ───────────────────────────────────
  {
    canonicalName: 'Starbucks',
    keywords: ['starbucks', 'ستاربكس', 'ستار باكس'],
    intent: 'food'
  },
  {
    canonicalName: 'Costa Coffee',
    keywords: ['costa', 'costa coffee', 'كوستا', 'كوستا كوفي'],
    intent: 'food'
  },
  {
    canonicalName: 'TBS (The Bakery Shop)',
    keywords: ['tbs', 'the bakery shop', 'تي بي اس'],
    intent: 'food'
  },
  {
    canonicalName: 'Cilantro / Beano\'s',
    keywords: ['cilantro', 'سيلانترو', 'beanos', 'beano', 'بينوس', 'espresso lab', 'brown nose', 'dunkin', 'دوناتس'],
    intent: 'food'
  },
  {
    canonicalName: 'McDonald\'s',
    keywords: ['mcdonald', 'mcdonalds', 'ماكدونالدز', 'ماك'],
    intent: 'food'
  },
  {
    canonicalName: 'KFC',
    keywords: ['kfc', 'كنتاكي', 'دجاج كنتاكي'],
    intent: 'food'
  },
  {
    canonicalName: 'Buffalo Burger',
    keywords: ['buffalo burger', 'بافلو برجر', 'burger king', 'برجر كينج', 'hardees', 'هارديز'],
    intent: 'food'
  },
  {
    canonicalName: 'Pizza Hut / Papa John\'s',
    keywords: ['pizza hut', 'بيتزا هت', 'papa john', 'بابا جونز', 'dominos', 'دومينوز'],
    intent: 'food'
  },
  {
    canonicalName: 'Bazooka',
    keywords: ['bazooka', 'بازوكا', 'heart attack', 'هارت اتاك'],
    intent: 'food'
  },
  {
    canonicalName: 'Koshary',
    keywords: ['koshary', 'كشري', 'tahrir', 'التحرير', 'sayed hanafy', 'سيد حنفي', 'tom and basly', 'توم اند بصل'],
    intent: 'food'
  },
  {
    canonicalName: 'Carrefour',
    keywords: ['carrefour', 'كارفور'],
    intent: 'food'
  },
  {
    canonicalName: 'Hyper One',
    keywords: ['hyper one', 'hyperone', 'هايبر وان', 'هايبروان'],
    intent: 'food'
  },
  {
    canonicalName: 'LuLu Hypermarket',
    keywords: ['lulu', 'لولو'],
    intent: 'food'
  },
  {
    canonicalName: 'Gourmet',
    keywords: ['gourmet', 'جورميه'],
    intent: 'food'
  },
  {
    canonicalName: 'Metro Market',
    keywords: ['metro market', 'سوبرماركت مترو', 'خير زمان', 'kheir zaman'],
    intent: 'food'
  },
  {
    canonicalName: 'Kazyon',
    keywords: ['kazyon', 'كازيون'],
    intent: 'food'
  },
  {
    canonicalName: 'Fathalla Market',
    keywords: ['fathalla', 'فتح الله'],
    intent: 'food'
  },
  {
    canonicalName: 'Seoudi Supermarket',
    keywords: ['seoudi', 'سعودي', 'سوبرماركت سعودي'],
    intent: 'food'
  },
  {
    canonicalName: 'BIM Market',
    keywords: ['bim', 'بيم', 'اولاد رجب', 'ragab sons', 'المحلاوي'],
    intent: 'food'
  },
  {
    canonicalName: 'Talabat',
    keywords: ['talabat', 'طلبات', 'elmenus', 'المنيوز', 'breadfast', 'بريدفاست', 'instashop', 'rabbit mart'],
    intent: 'food'
  },

  // ── Shopping, Apparel & Tech ───────────────────────────────────────────────
  {
    canonicalName: 'Zara',
    keywords: ['zara', 'زارا', 'pull and bear', 'pull&bear', 'bershka', 'بيرشكا', 'massimo dutti', 'stradivarius'],
    intent: 'shopping'
  },
  {
    canonicalName: 'H&M',
    keywords: ['h&m', 'h & m', 'اتش اند ام', 'إتش آند إم'],
    intent: 'shopping'
  },
  {
    canonicalName: 'LC Waikiki',
    keywords: ['lc waikiki', 'lcwaikiki', 'ال سي وايكيكي', 'defacto', 'ديفاكتو'],
    intent: 'shopping'
  },
  {
    canonicalName: 'Nike / Adidas / Puma',
    keywords: ['nike', 'نايك', 'adidas', 'اديداس', 'puma', 'بوما', 'skechers', 'سكيتشرز'],
    intent: 'shopping'
  },
  {
    canonicalName: 'B.TECH',
    keywords: ['b.tech', 'btech', 'بي تك', 'raya', 'راية', '2b', 'dream 2000', 'دريم 2000', 'sharaf dg'],
    intent: 'shopping'
  },
  {
    canonicalName: 'TradeLine (Apple Reseller)',
    keywords: ['tradeline', 'ت تريد لاين', 'تريد لاين', 'switch plus'],
    intent: 'shopping'
  },
  {
    canonicalName: 'Amazon',
    keywords: ['amazon', 'امازون', 'أمازون'],
    intent: 'shopping'
  },
  {
    canonicalName: 'Noon',
    keywords: ['noon', 'نون'],
    intent: 'shopping'
  },
  {
    canonicalName: 'Jumia',
    keywords: ['jumia', 'جوميا', 'shein', 'شي ان', 'temu', 'تيمو'],
    intent: 'shopping'
  },

  // ── Subscriptions & Entertainment ──────────────────────────────────────────
  {
    canonicalName: 'Netflix',
    keywords: ['netflix', 'نتفلكس', 'نتفليكس'],
    intent: 'bills'
  },
  {
    canonicalName: 'Spotify',
    keywords: ['spotify', 'سبوتيفاي'],
    intent: 'bills'
  },
  {
    canonicalName: 'Shahid VIP',
    keywords: ['shahid', 'شاهد', 'watch it', 'واتش ات', 'anghami', 'انغامي'],
    intent: 'bills'
  },
  {
    canonicalName: 'YouTube Premium',
    keywords: ['youtube', 'يوتيوب', 'google play', 'google *', 'play store'],
    intent: 'bills'
  },
  {
    canonicalName: 'Apple Digital Services',
    // Note: specifically apple.com/bill or itunes to distinguish from physical Apple Pay
    keywords: ['apple.com/bill', 'itunes', 'apple subscription', 'icloud', 'apple music'],
    intent: 'bills'
  },
  {
    canonicalName: 'ChatGPT / OpenAI',
    keywords: ['chatgpt', 'openai', 'claude', 'anthropic', 'midjourney'],
    intent: 'bills'
  },
  {
    canonicalName: 'Vox Cinemas / Cinema',
    keywords: ['vox', 'سينما فوكس', 'cinema', 'سينما', 'renaissance cinema', 'imax'],
    intent: 'entertainment'
  },

  // ── Utilities & Telecom Bills ──────────────────────────────────────────────
  {
    canonicalName: 'Vodafone',
    keywords: ['vodafone', 'فودافون', 'vfcash', 'vodafone cash'],
    intent: 'bills'
  },
  {
    canonicalName: 'Orange',
    keywords: ['orange', 'اورانج', 'أورانج', 'orange cash'],
    intent: 'bills'
  },
  {
    canonicalName: 'Etisalat e&',
    keywords: ['etisalat', 'اتصالات', 'etisalat cash'],
    intent: 'bills'
  },
  {
    canonicalName: 'WE / Telecom Egypt',
    keywords: ['telecom egypt', 'المصرية للاتصالات', 'we egypt', 'we internet', 'تي اي داتا', 'te data'],
    intent: 'bills'
  },
  {
    canonicalName: 'Fawry Pay',
    keywords: ['fawry', 'فوري'],
    intent: 'bills'
  }
];

/**
 * Keyword hints for general text that might not mention a specific brand.
 */
const INTENT_KEYWORD_RULES = [
  {
    intent: 'transport' as const,
    keywords: [
      'fuel', 'gas', 'gasoline', 'petrol', 'diesel', 'taxi', 'cab', 'ride', 'fare', 'parking', 'toll',
      'بنزين', 'تفويلة', 'سولار', 'غاز', 'محطة', 'مواصلات', 'تاكسي', 'اجرة', 'أجرة', 'كارته', 'كارتة',
      'ركنة', 'باركينج', 'جراج', 'موقف'
    ]
  },
  {
    intent: 'health' as const,
    keywords: [
      'pharmacy', 'medicine', 'drug', 'doctor', 'clinic', 'hospital', 'lab', 'medical', 'dentist',
      'صيدلية', 'دواء', 'دوا', 'علاج', 'دكتور', 'طبيب', 'عيادة', 'مستشفى', 'تحاليل', 'كشف', 'اشعة', 'نظارة'
    ]
  },
  {
    intent: 'food' as const,
    keywords: [
      'food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'coffee', 'eat', 'meal', 'burger',
      'pizza', 'bakery', 'supermarket', 'groceries', 'market', 'acai',
      'اكل', 'أكل', 'طعام', 'غدا', 'عشا', 'فطار', 'مطعم', 'كافيه', 'قهوة', 'مخبز', 'سوبرماركت', 'ماركت',
      'خضار', 'فاكهة', 'لحمة', 'فراخ', 'حلويات'
    ]
  },
  {
    intent: 'shopping' as const,
    keywords: [
      'shopping', 'clothes', 'shoes', 'apparel', 'fashion', 'electronics', 'mall', 'store',
      'تسوق', 'شوبينج', 'ملابس', 'هدوم', 'لبس', 'احذية', 'أحذية', 'شنطة', 'محل', 'مول'
    ]
  },
  {
    intent: 'bills' as const,
    keywords: [
      'bill', 'utility', 'electricity', 'water', 'internet', 'gas bill', 'recharge', 'subscription',
      'فاتورة', 'كهرباء', 'كهربا', 'مياه', 'ميه', 'انترنت', 'نت', 'شحن كارت', 'اشتراك'
    ]
  },
  {
    intent: 'entertainment' as const,
    keywords: [
      'entertainment', 'movie', 'cinema', 'theatre', 'concert', 'game', 'playstation',
      'ترفيه', 'سينما', 'فيلم', 'مسرح', 'ملاهي', 'حفلة', 'العاب'
    ]
  },
  {
    intent: 'income' as const,
    keywords: [
      'salary', 'income', 'bonus', 'credited', 'deposit', 'earned', 'got paid',
      'مرتب', 'راتب', 'إيداع', 'ايداع', 'دخل', 'مكافأة', 'قبضت', 'تحويل وارد'
    ]
  }
];

/**
 * Normalizes input text for resilient fuzzy matching.
 */
export function cleanSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[-_.,/\\:;*#$@!?()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent classifier that inspects merchant name and context,
 * accurately maps to one of the user's defined categories,
 * and completely prevents "Apple Pay" false positives.
 */
export function classifyExpenseCategory(
  rawText: string,
  detectedMerchant: string | undefined,
  userCategories: Category[]
): CategoryMatchResult {
  const cleanedText = cleanSearchText(rawText);
  const cleanedMerchant = cleanSearchText(detectedMerchant || '');
  const combined = `${cleanedMerchant} ${cleanedText}`;

  let matchedMerchantName: string | undefined = undefined;
  let targetIntent: CategoryMatchResult['intent'] = 'general';
  let matchConfidence = 0;

  // 1. Check known brand database (highest priority)
  for (const def of MERCHANT_DATABASE) {
    for (const kw of def.keywords) {
      const cleanKw = cleanSearchText(kw);
      // Give highest score if merchant matches keyword directly
      if (cleanedMerchant && (cleanedMerchant === cleanKw || cleanedMerchant.includes(cleanKw))) {
        matchedMerchantName = def.canonicalName;
        targetIntent = def.intent;
        matchConfidence = 0.98;
        break;
      }
      // Or if the combined text contains the keyword
      if (combined.includes(cleanKw)) {
        matchedMerchantName = def.canonicalName;
        targetIntent = def.intent;
        matchConfidence = 0.90;
        break;
      }
    }
    if (matchedMerchantName) break;
  }

  // 2. If no brand hit, check contextual keyword rules
  if (!matchedMerchantName) {
    for (const rule of INTENT_KEYWORD_RULES) {
      for (const kw of rule.keywords) {
        const cleanKw = cleanSearchText(kw);
        if (combined.includes(cleanKw)) {
          targetIntent = rule.intent;
          matchConfidence = 0.75;
          break;
        }
      }
      if (targetIntent !== 'general') break;
    }
  }

  // 3. Match the detected intent to the best available user category
  let bestCategory: Category | undefined;

  const findCategory = (predicates: ((c: Category) => boolean)[]): Category | undefined => {
    for (const pred of predicates) {
      const found = userCategories.find(pred);
      if (found) return found;
    }
    return undefined;
  };

  if (targetIntent === 'transport') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('transport'),
      c => c.name.includes('مواصلات') || c.name.includes('بنزين') || c.name.includes('سيارة') || c.name.includes('وقود'),
      c => c.iconName.toLowerCase().includes('car') || c.iconName.toLowerCase().includes('gas')
    ]);
  } else if (targetIntent === 'health') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('health') || c.name.toLowerCase().includes('fitness') || c.name.toLowerCase().includes('pharmacy'),
      c => c.name.includes('صحة') || c.name.includes('صيدلية') || c.name.includes('علاج') || c.name.includes('طبي'),
      c => c.iconName.toLowerCase().includes('heart') || c.iconName.toLowerCase().includes('firstaid')
    ]);
  } else if (targetIntent === 'food') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('food') || c.name.toLowerCase().includes('dining') || c.name.toLowerCase().includes('grocer'),
      c => c.name.includes('طعام') || c.name.includes('أكل') || c.name.includes('مطاعم') || c.name.includes('سوبر'),
      c => c.iconName.toLowerCase().includes('fork') || c.iconName.toLowerCase().includes('coffee')
    ]);
  } else if (targetIntent === 'shopping') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('shop'),
      c => c.name.includes('تسوق') || c.name.includes('مشتريات') || c.name.includes('ملابس'),
      c => c.iconName.toLowerCase().includes('cart') || c.iconName.toLowerCase().includes('bag')
    ]);
  } else if (targetIntent === 'bills') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('bill') || c.name.toLowerCase().includes('sub'),
      c => c.name.includes('فواتير') || c.name.includes('اشتراك'),
      c => c.iconName.toLowerCase().includes('receipt') || c.iconName.toLowerCase().includes('credit')
    ]);
  } else if (targetIntent === 'entertainment') {
    bestCategory = findCategory([
      c => c.name.toLowerCase().includes('entertain'),
      c => c.name.includes('ترفيه') || c.name.includes('خروجات'),
      c => c.iconName.toLowerCase().includes('film') || c.iconName.toLowerCase().includes('ticket')
    ]);
  } else if (targetIntent === 'income') {
    bestCategory = userCategories.find(c => c.type === 'income');
  }

  // Fallback if no matching intent or category found:
  // Use first expense category (e.g. Food & Dining or General), NEVER default to Bills!
  if (!bestCategory && userCategories.length > 0) {
    bestCategory = userCategories.find(c => c.type === 'expense') || userCategories[0];
  }

  return {
    categoryId: bestCategory?.id || '',
    categoryName: bestCategory?.name || 'General',
    matchedMerchant: matchedMerchantName,
    confidence: matchConfidence,
    intent: targetIntent
  };
}

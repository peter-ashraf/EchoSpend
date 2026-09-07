import test from 'node:test';
import assert from 'node:assert/strict';

// ── 1. Arabic Text & Numeral Normalization ───────────────────────────────────
const EASTERN_ARABIC_DIGITS = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function normalizeArabicText(text) {
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

test('Arabic Numeral Normalization transforms Eastern Arabic digits to Western digits', () => {
  assert.equal(normalizeArabicText('١٥٠'), '150');
  assert.equal(normalizeArabicText('٢٥.٥'), '25.5');
  assert.equal(normalizeArabicText('٠١٢٣٤٥٦٧٨٩'), '0123456789');
  assert.equal(normalizeArabicText('١٬٢٥٠٫٥٠'), '1250.50');
});

test('Arabic Orthography Normalization standardizes alef, teh marbuta, and tashkeel', () => {
  assert.equal(normalizeArabicText('فَاتُورَة كَهْرَبَاء'), 'فاتوره كهرباء');
  assert.equal(normalizeArabicText('إِسْتِرْدَاد'), 'استرداد');
  assert.equal(normalizeArabicText('مُسْتَشْفَى'), 'مستشفي');
});

// ── 2. Expense Category Matching ──────────────────────────────────────────────
function categorizeMerchant(rawText, userCategories) {
  const norm = normalizeArabicText(rawText.toLowerCase());

  if (/راتب|مرتب|قبضت|تحويل وارد|ارباح|دخل/i.test(norm)) {
    const incomeCat = userCategories.find((c) => c.type === 'income');
    return { id: incomeCat?.id || 'income', type: 'income' };
  }

  if (/fuel|gas|petrol|taxi|uber|careem|بنزين|مواصلات|تاكسي|مترو/i.test(norm)) {
    const cat = userCategories.find((c) => /transp|fuel|مواصلات|بنزين/i.test(c.name));
    return { id: cat?.id || 'transp', type: 'expense' };
  }
  if (/grocery|supermarket|سوبرماركت|بقالة|خضار|فاكهة/i.test(norm)) {
    const cat = userCategories.find((c) => /grocer|بقالة|سوبرماركت/i.test(c.name));
    return { id: cat?.id || 'grocer', type: 'expense' };
  }
  if (/food|dinner|lunch|breakfast|cafe|coffee|مطعم|اكل|كافي[ةه]|قهو[ةه]|starbucks/i.test(norm)) {
    const cat = userCategories.find((c) => /food|dining|مطعم/i.test(c.name));
    return { id: cat?.id || 'food', type: 'expense' };
  }

  return { id: 'other', type: 'expense' };
}

test('Category matching correctly identifies intents for food, transport, and income', () => {
  const categories = [
    { id: 'cat-1', name: 'Food & Dining', type: 'expense' },
    { id: 'cat-2', name: 'Transportation', type: 'expense' },
    { id: 'cat-3', name: 'Groceries', type: 'expense' },
    { id: 'cat-4', name: 'Salary & Income', type: 'income' },
  ];

  assert.equal(categorizeMerchant('قهوة من ستارباكس', categories).id, 'cat-1');
  assert.equal(categorizeMerchant('بنزين 92 للسيارة', categories).id, 'cat-2');
  assert.equal(categorizeMerchant('سوبرماركت كارفور', categories).id, 'cat-3');
  assert.equal(categorizeMerchant('قبضت المرتب النهاردة', categories).type, 'income');
});

// ── 3. Transaction Delta & Atomic Update Logic ─────────────────────────────────
test('Atomic Transaction Update correctly updates wallet balances without drift', () => {
  const wallets = [
    { id: 'w-cash', name: 'Cash', balance: 1000 },
    { id: 'w-bank', name: 'Bank Account', balance: 5000 },
  ];

  const oldTx = {
    id: 'tx-1',
    type: 'expense',
    amount: 200,
    walletId: 'w-cash',
    date: '2026-09-01T10:00:00Z',
  };

  // Simulating the reverse-delta and re-apply logic from useStore:
  // Step 1: Reverse oldTx
  if (oldTx.type === 'expense') {
    const w = wallets.find((w) => w.id === oldTx.walletId);
    if (w) w.balance += oldTx.amount; // reverse expense => +200
  }
  assert.equal(wallets[0].balance, 1200); // 1000 + 200

  // Step 2: Apply updatedTx: converted to transfer from w-cash to w-bank of 300
  const updatedTx = {
    id: 'tx-1',
    type: 'transfer',
    amount: 300,
    walletId: 'w-cash',
    targetWalletId: 'w-bank',
    date: '2026-09-01T10:00:00Z',
  };

  const sourceWallet = wallets.find((w) => w.id === updatedTx.walletId);
  const targetWallet = wallets.find((w) => w.id === updatedTx.targetWalletId);
  if (sourceWallet) sourceWallet.balance -= updatedTx.amount;
  if (targetWallet) targetWallet.balance += updatedTx.amount;

  assert.equal(wallets.find((w) => w.id === 'w-cash')?.balance, 900);  // 1200 - 300
  assert.equal(wallets.find((w) => w.id === 'w-bank')?.balance, 5300); // 5000 + 300
});

// ── 4. Current Month Budget Expense Filtering ─────────────────────────────────
test('Current Month Budget calculation strictly filters out previous months and years', () => {
  const simulatedTransactions = [
    { id: '1', type: 'expense', amount: 150, date: '2026-09-02T12:00:00Z' },
    { id: '2', type: 'expense', amount: 350, date: '2026-09-05T15:30:00Z' },
    { id: '3', type: 'income', amount: 2000, date: '2026-09-01T08:00:00Z' }, // income ignored
    { id: '4', type: 'expense', amount: 800, date: '2026-08-15T10:00:00Z' }, // last month ignored
    { id: '5', type: 'expense', amount: 400, date: '2025-09-05T10:00:00Z' }, // last year ignored
  ];

  const now = new Date('2026-09-07T12:00:00Z');
  const currentMonthExpenses = simulatedTransactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const txDate = new Date(t.date);
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Only tx 1 (150) and tx 2 (350) should be included = 500
  assert.equal(currentMonthExpenses, 500);
});

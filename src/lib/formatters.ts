/**
 * formatters.ts — Formats financial numbers with Thndr-style privacy balance masking.
 */

export function formatAmount(
  amount: number,
  currency: string = 'EGP',
  hideBalance: boolean = false
): string {
  if (hideBalance) {
    return '••••••••';
  }
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'EGP' ? 'EGP ' : `${currency} `;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function maskText(text: string | number, hideBalance: boolean): string {
  if (!hideBalance) return String(text);
  return '••••••••';
}

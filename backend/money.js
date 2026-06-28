const ALLOWED_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR'];

const isAllowedCurrency = (c) => ALLOWED_CURRENCIES.includes(String(c || '').toUpperCase());

function toMinor(major) {
  const n = Number(major);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Enter a valid amount.' };
  const minor = Math.round(n * 100);
  if (!Number.isSafeInteger(minor)) return { ok: false, error: 'Amount is too large.' };
  return { ok: true, minor };
}

const fromMinor = (minor) => Math.round(Number(minor)) / 100;

function formatMoney(minor, currency) {
  const cur = isAllowedCurrency(currency) ? String(currency).toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol' }).format(fromMinor(minor));
  } catch {
    return `${cur} ${fromMinor(minor).toFixed(2)}`;
  }
}

module.exports = { ALLOWED_CURRENCIES, isAllowedCurrency, toMinor, fromMinor, formatMoney };

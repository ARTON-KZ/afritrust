const { isAllowedCurrency } = require('./money');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration({ name, email, password, currency } = {}) {
  const n = String(name || '').trim();
  if (n.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
  const e = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return { ok: false, error: 'Enter a valid email address.' };
  const p = String(password || '');
  if (p.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!/\d/.test(p)) return { ok: false, error: 'Password must contain at least one number.' };
  const c = String(currency || '').toUpperCase();
  if (!isAllowedCurrency(c)) return { ok: false, error: 'Choose a supported currency.' };
  return { ok: true, clean: { name: n, email: e, currency: c } };
}

module.exports = { validateRegistration, EMAIL_RE };

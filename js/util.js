// Shared frontend helpers: API calls, auth tokens, money formatting, toasts.
window.AT = (function () {
  const API = window.API_BASE;

  async function api(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(API + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  // Admin token storage
  const admin = {
    get: () => localStorage.getItem('aft_admin_token'),
    set: (t) => localStorage.setItem('aft_admin_token', t),
    clear: () => localStorage.removeItem('aft_admin_token'),
  };

  function fmtMoney(amount, currency = 'USD') {
    const n = Number(amount) || 0;
    const symbols = { NGN: '₦', USD: '$', GHS: 'GH₵', KES: 'KSh', ZAR: 'R', GBP: '£', EUR: '€', MXN: 'MX$' };
    const sym = symbols[currency] || (currency + ' ');
    return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function toast(msg, type = '') {
    let host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast-' + type : '');
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); }, 3800);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const CURRENCIES = ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'GBP', 'EUR', 'MXN'];
  const ACCOUNT_TYPES = ['Savings Account', 'Current Account', 'Checking Account', 'Fixed Deposit', 'Non Resident Account', 'Online Banking', 'Domiciliary Account', 'Joint Account'];
  const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Cameroon', 'Uganda', 'Tanzania', 'Côte d\'Ivoire', 'Senegal', 'Egypt', 'United Kingdom', 'United States', 'Other'];

  return { API, api, admin, fmtMoney, toast, escapeHtml, CURRENCIES, ACCOUNT_TYPES, COUNTRIES };
})();

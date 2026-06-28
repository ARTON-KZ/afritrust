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

  const CURRENCIES = ['MXN', 'ARS', 'CLP', 'COP', 'PEN', 'BOB', 'PYG', 'VES', 'USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'];

  // Bilingual account type labels: { value, es, en }
  const ACCOUNT_TYPES_I18N = [
    { value: 'savings',     es: 'Cuenta de ahorros',        en: 'Savings Account' },
    { value: 'current',     es: 'Cuenta corriente',         en: 'Current Account' },
    { value: 'checking',    es: 'Cuenta de cheques',        en: 'Checking Account' },
    { value: 'fixed',       es: 'Depósito a plazo fijo',    en: 'Fixed Deposit' },
    { value: 'nonresident', es: 'Cuenta no residente',      en: 'Non Resident Account' },
    { value: 'online',      es: 'Banca en línea',           en: 'Online Banking' },
    { value: 'domiciliary', es: 'Cuenta domiciliaria',      en: 'Domiciliary Account' },
    { value: 'joint',       es: 'Cuenta conjunta',          en: 'Joint Account' },
  ];

  // Bilingual country labels: { value, es, en }
  const COUNTRIES_I18N = [
    { value: 'Mexico',          es: 'México',               en: 'Mexico' },
    { value: 'Argentina',       es: 'Argentina',            en: 'Argentina' },
    { value: 'Chile',           es: 'Chile',                en: 'Chile' },
    { value: 'Colombia',        es: 'Colombia',             en: 'Colombia' },
    { value: 'Peru',            es: 'Perú',                 en: 'Peru' },
    { value: 'Ecuador',         es: 'Ecuador',              en: 'Ecuador' },
    { value: 'Bolivia',         es: 'Bolivia',              en: 'Bolivia' },
    { value: 'Paraguay',        es: 'Paraguay',             en: 'Paraguay' },
    { value: 'Venezuela',       es: 'Venezuela',            en: 'Venezuela' },
    { value: 'Nigeria',         es: 'Nigeria',              en: 'Nigeria' },
    { value: 'Ghana',           es: 'Ghana',                en: 'Ghana' },
    { value: 'Kenya',           es: 'Kenia',                en: 'Kenya' },
    { value: 'South Africa',    es: 'Sudáfrica',            en: 'South Africa' },
    { value: 'Cameroon',        es: 'Camerún',              en: 'Cameroon' },
    { value: 'Uganda',          es: 'Uganda',               en: 'Uganda' },
    { value: 'Tanzania',        es: 'Tanzania',             en: 'Tanzania' },
    { value: "Côte d'Ivoire",   es: "Costa de Marfil",     en: "Côte d'Ivoire" },
    { value: 'Senegal',         es: 'Senegal',              en: 'Senegal' },
    { value: 'Egypt',           es: 'Egipto',               en: 'Egypt' },
    { value: 'United Kingdom',  es: 'Reino Unido',          en: 'United Kingdom' },
    { value: 'United States',   es: 'Estados Unidos',       en: 'United States' },
    { value: 'Other',           es: 'Otro',                 en: 'Other' },
  ];

  // Flat arrays kept for backward compatibility
  const ACCOUNT_TYPES = ACCOUNT_TYPES_I18N.map((x) => x.en);
  const COUNTRIES = COUNTRIES_I18N.map((x) => x.en);

  // Populate a <select> element with localized options.
  // list = ACCOUNT_TYPES_I18N or COUNTRIES_I18N; lang = 'es' | 'en'
  function populateSelect(el, list, lang) {
    if (!el) return;
    const saved = el.value; // preserve current selection
    el.innerHTML = list.map((item) =>
      `<option value="${escapeHtml(item.value)}">${escapeHtml(item[lang] || item.en)}</option>`
    ).join('');
    if (saved) el.value = saved; // restore if still valid
  }

  return { API, api, admin, fmtMoney, toast, escapeHtml, CURRENCIES, ACCOUNT_TYPES, COUNTRIES, ACCOUNT_TYPES_I18N, COUNTRIES_I18N, populateSelect };
})();

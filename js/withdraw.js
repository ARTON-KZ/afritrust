// Authenticated withdrawal flow: step 1 collects details, step 2 confirms with an OTP.
// Requires a valid afritrust_token in localStorage; redirects to login.html if absent.
(function () {
  // ── Token guard ──────────────────────────────────────────────────────────────
  const token = localStorage.getItem('afritrust_token');
  if (!token) { location.href = 'login.html'; return; }

  const $ = (id) => document.getElementById(id);
  const errorBox = $('error');
  const showError = (msg) => {
    errorBox.textContent = msg;          // safe — textContent, never innerHTML
    errorBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearError = () => { errorBox.style.display = 'none'; };

  const auth = { Authorization: 'Bearer ' + token };
  const fmt = (minor, cur) => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol' }).format(minor / 100);
    } catch (_) {
      return (minor / 100).toFixed(2) + ' ' + cur;
    }
  };

  let details = null;
  let userCurrency = 'NGN'; // will be overwritten by profile fetch

  // ── Populate static dropdowns (localized) ────────────────────────────────
  function repopulateDropdowns() {
    const lang = (window.afriI18n && window.afriI18n.getLang()) || 'es';
    AT.populateSelect($('accountType'), AT.ACCOUNT_TYPES_I18N, lang);
    AT.populateSelect($('bankCountry'), AT.COUNTRIES_I18N, lang);
  }
  repopulateDropdowns();
  // Re-populate when language changes
  document.addEventListener('afri:langchange', repopulateDropdowns);
  $('tgLink').href = window.AFRITRUST_TELEGRAM || 'https://t.me/';

  // ── Load profile: set currency + balance ─────────────────────────────────
  (async function loadProfile() {
    try {
      const res = await fetch((window.API_BASE || '') + '/api/user/profile', { headers: auth });
      if (res.status === 401) { localStorage.clear(); location.href = 'login.html'; return; }
      const u = await res.json();
      userCurrency = u.currency || 'NGN';

      // Populate currency select with ONLY the user's currency, then disable it
      $('currency').innerHTML = `<option value="${AT.escapeHtml(userCurrency)}">${AT.escapeHtml(userCurrency)}</option>`;
      $('currency').disabled = true;

      // Display available balance
      const balanceEl = $('availableBalance');
      if (balanceEl) {
        balanceEl.textContent = fmt(u.balance_minor, userCurrency);
        balanceEl.closest('.balance-hint') && (balanceEl.closest('.balance-hint').style.display = '');
      }
    } catch (err) {
      // Non-fatal: currency select will remain editable as fallback
      // Populate full currency list so the page isn't broken
      $('currency').innerHTML = AT.CURRENCIES.map((c) => `<option${c === 'NGN' ? ' selected' : ''}>${c}</option>`).join('');
    }
  })();

  // ── Step 1 → validate → step 2 ────────────────────────────────────────────
  $('detailsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const fullName    = $('fullName').value.trim();
    const amount      = parseFloat($('amount').value);
    const currency    = $('currency').value;
    const bankName    = $('bankName').value.trim();
    const accountName = $('accountName').value.trim();
    const accountNumber = $('accountNumber').value.trim();

    if (!fullName)  { showError('Enter your full name.'); return; }
    if (!amount || amount <= 0) { showError('Enter how much you want to withdraw.'); return; }
    if (!bankName || !accountName || !accountNumber) {
      showError('Fill in your bank name, account name and account number.'); return;
    }

    // Map to the exact field names the API expects (snake_case)
    details = {
      amount,
      currency,
      bank_name:        bankName,
      account_name:     accountName,
      account_number:   accountNumber,
      account_type:     $('accountType').value,
      bank_country:     $('bankCountry').value,
      routine_bank_code: $('routine').value.trim(),
    };

    $('reviewSummary').innerHTML =
      `Sending <strong>${AT.escapeHtml(fmt(Math.round(parseFloat($('amount').value) * 100), currency))}</strong> to <strong>${AT.escapeHtml(accountName)}</strong> · ${AT.escapeHtml(bankName)} · ${AT.escapeHtml(accountNumber)}`;

    $('step1').style.display = 'none';
    $('step2').style.display = 'block';
    $('stepDot2').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    $('otp').focus();
  });

  $('backBtn').addEventListener('click', () => {
    clearError();
    $('step2').style.display = 'none';
    $('step1').style.display = 'block';
    $('stepDot2').classList.remove('active');
  });

  // ── Step 2 → submit ───────────────────────────────────────────────────────
  $('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const otp = $('otp').value.trim();
    if (!otp) { showError('Enter the confirmation code from your Telegram admin.'); return; }

    const btn = $('submitBtn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const res = await AT.api('/api/user/withdraw', {
        method: 'POST',
        token,
        body: { ...details, otp },
      });
      window.location.href = 'success.html?ref=' + encodeURIComponent(res.reference);
    } catch (err) {
      showError(err.message);           // err.message from AT.api — safe text
      btn.disabled = false;
      btn.textContent = (window.afriI18n && window.afriI18n.t('wd-btn-submit')) || 'Submit withdrawal request';
    }
  });
})();

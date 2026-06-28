// Public withdrawal flow: step 1 collects details, step 2 confirms with a code.
(function () {
  const $ = (id) => document.getElementById(id);
  const errorBox = $('error');
  const showError = (msg) => { errorBox.textContent = msg; errorBox.style.display = 'block'; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const clearError = () => { errorBox.style.display = 'none'; };

  let details = null;

  // Populate dropdowns
  $('currency').innerHTML = AT.CURRENCIES.map((c) => `<option${c === 'NGN' ? ' selected' : ''}>${c}</option>`).join('');
  $('accountType').innerHTML = AT.ACCOUNT_TYPES.map((t) => `<option>${t}</option>`).join('');
  $('bankCountry').innerHTML = AT.COUNTRIES.map((c) => `<option>${AT.escapeHtml(c)}</option>`).join('');
  $('tgLink').href = window.AFRITRUST_TELEGRAM || 'https://t.me/';

  // Step 1 -> validate -> step 2
  $('detailsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const fullName = $('fullName').value.trim();
    const amount = parseFloat($('amount').value);
    const currency = $('currency').value;
    const bankName = $('bankName').value.trim();
    const accountName = $('accountName').value.trim();
    const accountNumber = $('accountNumber').value.trim();

    if (!fullName) { showError('Enter your full name.'); return; }
    if (!amount || amount <= 0) { showError('Enter how much you want to withdraw.'); return; }
    if (!bankName || !accountName || !accountNumber) { showError('Fill in your bank name, account name and account number.'); return; }

    details = {
      full_name: fullName,
      contact: $('contact').value.trim(),
      amount,
      currency,
      fee: 0,
      beneficiary_bank_name: bankName,
      beneficiary_account_name: accountName,
      beneficiary_account_number: accountNumber,
      beneficiary_account_type: $('accountType').value,
      beneficiary_bank_country: $('bankCountry').value,
      routine_bank_code: $('routine').value.trim(),
    };

    $('reviewSummary').innerHTML =
      `Sending <strong>${AT.fmtMoney(amount, currency)}</strong> to <strong>${AT.escapeHtml(accountName)}</strong> · ${AT.escapeHtml(bankName)} · ${AT.escapeHtml(accountNumber)}`;

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

  // Step 2 -> submit
  $('otpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const otp = $('otp').value.trim();
    if (!otp) { showError('Enter the confirmation code from your Telegram admin.'); return; }

    const btn = $('submitBtn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const res = await AT.api('/api/withdraw', { method: 'POST', body: { ...details, otp } });
      window.location.href = 'success.html?ref=' + encodeURIComponent(res.reference);
    } catch (err) {
      showError(err.message);
      btn.disabled = false; btn.textContent = 'Submit withdrawal request';
    }
  });
})();

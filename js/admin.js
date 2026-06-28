// Admin dashboard: login gate + confirmation codes + withdrawal requests.
(function () {
  const $ = (id) => document.getElementById(id);
  let token = AT.admin.get();

  function showApp() {
    $('adminLogin').style.display = 'none';
    $('adminApp').style.display = 'block';
    loadWithdrawals();
    loadCodes();
  }

  $('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginError').style.display = 'none';
    const password = $('adminPassword').value;
    const btn = $('adminLoginBtn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const data = await AT.api('/api/admin/login', { method: 'POST', body: { password } });
      AT.admin.set(data.token); token = data.token;
      showApp();
    } catch (err) {
      $('loginError').textContent = err.message; $('loginError').style.display = 'block';
    } finally { btn.disabled = false; btn.textContent = 'Sign in'; }
  });

  $('adminLogout').addEventListener('click', () => { AT.admin.clear(); window.location.reload(); });

  // Tabs
  $('adminNav').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    document.querySelectorAll('#adminNav button[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
    document.querySelectorAll('.admin-tabpane').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + b.dataset.tab));
  });

  async function adminApi(path, opts = {}) {
    try { return await AT.api(path, { ...opts, token }); }
    catch (err) {
      if (/expired|Unauthorized|Invalid or expired/i.test(err.message)) {
        AT.admin.clear(); AT.toast('Session expired. Please sign in again.', 'error');
        setTimeout(() => window.location.reload(), 1200);
      }
      throw err;
    }
  }

  const badge = (s) => `<span class="badge badge-${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
  const dt = (s) => s ? new Date(s + 'Z').toLocaleString() : '—';

  // ---- Withdrawals ----
  async function loadWithdrawals() {
    try {
      const { withdrawals } = await adminApi('/api/admin/withdrawals');
      $('withdrawalsEmpty').innerHTML = withdrawals.length ? '' :
        `<div class="empty-state"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg><p>No withdrawal requests yet.</p></div>`;
      $('withdrawalsBody').innerHTML = withdrawals.map((w) => `
        <tr>
          <td>${dt(w.created_at)}</td>
          <td style="font-weight:600">${AT.escapeHtml(w.full_name)}</td>
          <td>${AT.escapeHtml(w.contact || '—')}</td>
          <td style="font-weight:700">${AT.fmtMoney(w.amount, w.currency)}</td>
          <td>${AT.escapeHtml(w.beneficiary_bank_name)}</td>
          <td>${AT.escapeHtml(w.beneficiary_account_name)}</td>
          <td class="mono">${AT.escapeHtml(w.beneficiary_account_number)}</td>
          <td>${AT.escapeHtml(w.beneficiary_account_type || '—')}</td>
          <td>${AT.escapeHtml(w.beneficiary_bank_country || '—')}</td>
          <td class="mono">${AT.escapeHtml(w.otp_code || '—')}</td>
          <td>${badge(w.status)}</td>
          <td>${w.status === 'pending' ? `
            <div class="table-actions">
              <button class="btn btn-primary btn-sm" data-paid="${w.id}">Mark paid</button>
              <button class="btn btn-ghost btn-sm" data-reject="${w.id}">Reject</button>
            </div>` : `<span class="muted" style="font-size:.82rem">${w.paid_at ? 'Paid ' + dt(w.paid_at) : '—'}</span>`}</td>
        </tr>`).join('');
    } catch (err) { AT.toast(err.message, 'error'); }
  }

  $('refreshWithdrawals').addEventListener('click', loadWithdrawals);

  $('withdrawalsBody').addEventListener('click', async (e) => {
    const paid = e.target.closest('[data-paid]');
    const reject = e.target.closest('[data-reject]');
    try {
      if (paid) {
        if (!confirm('Mark this request as paid?')) return;
        await adminApi(`/api/admin/withdrawals/${paid.dataset.paid}/paid`, { method: 'POST', body: {} });
        AT.toast('Marked as paid.', 'success');
      } else if (reject) {
        if (!confirm('Reject this request?')) return;
        await adminApi(`/api/admin/withdrawals/${reject.dataset.reject}/reject`, { method: 'POST', body: {} });
        AT.toast('Request rejected.');
      } else return;
      loadWithdrawals();
    } catch (err) { AT.toast(err.message, 'error'); }
  });

  // ---- Codes ----
  $('genOtpBtn').addEventListener('click', async () => {
    try {
      const { code } = await adminApi('/api/admin/otps', { method: 'POST', body: {} });
      const banner = $('newCodeBanner');
      banner.innerHTML = `New code generated: <strong style="font-family:var(--font-mono);font-size:1.05rem;letter-spacing:.12em">${code}</strong> — send this to the member on Telegram.`;
      banner.style.display = 'block';
      loadCodes();
    } catch (err) { AT.toast(err.message, 'error'); }
  });

  async function loadCodes() {
    try {
      const { otps } = await adminApi('/api/admin/otps');
      $('codesEmpty').innerHTML = otps.length ? '' : '<div class="empty-state"><p>No codes yet. Generate one to hand to a member.</p></div>';
      $('codesBody').innerHTML = otps.map((o) => `
        <tr>
          <td class="mono" style="font-size:1rem;letter-spacing:.1em">${AT.escapeHtml(o.code)}</td>
          <td>${o.status === 'active' ? '<span class="badge badge-paid">Active</span>' : '<span class="badge badge-rejected">Used</span>'}</td>
          <td>${AT.escapeHtml(o.note || '—')}</td>
          <td>${dt(o.created_at)}</td>
          <td>${dt(o.used_at)}</td>
          <td><button class="btn btn-ghost btn-sm" data-del-otp="${o.id}">Delete</button></td>
        </tr>`).join('');
    } catch (err) { AT.toast(err.message, 'error'); }
  }

  $('codesBody').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-otp]');
    if (!del) return;
    if (!confirm('Delete this code?')) return;
    try { await adminApi(`/api/admin/otps/${del.dataset.delOtp}`, { method: 'DELETE' }); loadCodes(); }
    catch (err) { AT.toast(err.message, 'error'); }
  });

  // Boot
  if (token) showApp();
})();

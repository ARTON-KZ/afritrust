// Admin dashboard: login (email+password) → users / withdrawals / transactions / OTP codes.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── Token storage: use key required by the task brief ──────────────────────
  const TOKEN_KEY = 'afritrust_admin_token';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  // Returns the Authorization header object for admin API calls.
  function adminAuth() {
    const t = getToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  // ── Wrappers ────────────────────────────────────────────────────────────────

  // Thin wrapper over AT.api that injects the admin token and handles 401.
  async function adminApi(path, opts = {}) {
    try {
      return await AT.api(path, { ...opts, token: getToken() });
    } catch (err) {
      if (/expired|Unauthorized|Invalid or expired|401/i.test(err.message)) {
        clearToken();
        AT.toast('Session expired. Please sign in again.', 'error');
        setTimeout(() => window.location.reload(), 1200);
      }
      throw err;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // Format integer minor-unit amounts (e.g. 249000 → $2,490.00)
  function fmtMinor(amountMinor, currency) {
    const cur = currency || 'NGN';
    const val = (Number(amountMinor) || 0) / 100;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency: cur,
        currencyDisplay: 'narrowSymbol',
      }).format(val);
    } catch (_) {
      // Fallback for currencies Intl doesn't know
      return AT.fmtMoney(val, cur);
    }
  }

  // Safe datetime formatter
  const dt = (s) => s ? new Date(s.endsWith('Z') ? s : s + 'Z').toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  // Status badge HTML  (uses escaped text so safe for all strings)
  function badge(s) {
    const cls = s === 'awaiting_approval' ? 'badge-waiting'
              : s === 'pending' ? 'badge-pending'
              : (s === 'paid' || s === 'active' || s === 'completed' || s === 'credit') ? 'badge-paid'
              : 'badge-rejected';
    const label = AT.escapeHtml(s === 'awaiting_approval' ? 'Awaiting approval' : (String(s).charAt(0).toUpperCase() + String(s).slice(1)));
    return `<span class="badge ${cls}">${label}</span>`;
  }

  // ── Show / hide panels ───────────────────────────────────────────────────────

  function showApp() {
    $('adminLogin').style.display = 'none';
    $('adminApp').style.display = 'block';
    loadUsers();
    loadWithdrawals();
    loadTransactions();
    loadCodes();
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  $('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginError').style.display = 'none';
    const email    = $('adminEmail').value.trim();
    const password = $('adminPassword').value;
    const btn      = $('adminLoginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      const data = await AT.api('/api/auth/login', { method: 'POST', body: { email, password } });

      // Verify caller is an admin
      if (!data.user || data.user.role !== 'admin') {
        $('loginError').textContent = 'Admin access required. This account does not have admin privileges.';
        $('loginError').style.display = 'block';
        return;
      }

      setToken(data.token);
      showApp();
    } catch (err) {
      $('loginError').textContent = err.message;
      $('loginError').style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  $('adminLogout').addEventListener('click', () => {
    clearToken();
    window.location.reload();
  });

  // ── Tab navigation ───────────────────────────────────────────────────────────

  $('adminNav').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    document.querySelectorAll('#adminNav button[data-tab]').forEach((x) =>
      x.classList.toggle('active', x === b));
    document.querySelectorAll('.admin-tabpane').forEach((p) =>
      p.classList.toggle('active', p.id === 'tab-' + b.dataset.tab));
  });

  // ── USERS ───────────────────────────────────────────────────────────────────

  async function loadUsers() {
    try {
      // API returns a plain array
      const raw = await adminApi('/api/admin/users');
      const users = Array.isArray(raw) ? raw : (raw.users || []);
      const tbody = $('usersTableBody');
      const empty = $('usersEmpty');

      if (!users || users.length === 0) {
        tbody.innerHTML = '';
        empty.innerHTML = '<div class="empty-state"><p>No users found.</p></div>';
        return;
      }
      empty.innerHTML = '';

      tbody.innerHTML = users.map((u) => {
        const blocked = Boolean(u.blocked);
        const bal = fmtMinor(u.balance_minor, u.currency);
        return `<tr>
          <td style="font-weight:600">${AT.escapeHtml(u.name || u.full_name || '—')}</td>
          <td>${AT.escapeHtml(u.email)}</td>
          <td class="mono">${AT.escapeHtml(u.currency || 'NGN')}</td>
          <td style="font-weight:700;font-variant-numeric:tabular-nums">${bal}</td>
          <td>${badge(u.role || 'user')}</td>
          <td>${blocked
            ? '<span class="badge badge-rejected">Blocked</span>'
            : '<span class="badge badge-paid">Active</span>'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-primary btn-sm" data-credit="${u.id}">Credit</button>
              <button class="btn btn-ghost btn-sm"   data-debit="${u.id}">Debit</button>
              <button class="btn btn-ghost btn-sm"   data-block="${u.id}" data-blocked="${blocked ? '1' : '0'}">${blocked ? 'Unblock' : 'Block'}</button>
              <button class="btn btn-ghost btn-sm"   data-otp="${u.id}">Issue OTP</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  // Credit a user
  async function credit(userId) {
    const amount = prompt('Amount to credit (major units, e.g. 50.00):');
    if (amount === null || amount.trim() === '') return;
    const note = prompt('Note (optional):') || '';
    try {
      const r = await fetch(AT.API + `/api/admin/users/${userId}/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuth() },
        body: JSON.stringify({ amount, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { clearToken(); AT.toast('Session expired.', 'error'); setTimeout(() => window.location.reload(), 1200); return; }
        throw new Error(d.error || 'Credit failed.');
      }
      AT.toast('Credited successfully.', 'success');
      loadUsers();
      loadTransactions();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  // Debit a user
  async function debit(userId) {
    const amount = prompt('Amount to debit (major units, e.g. 50.00):');
    if (amount === null || amount.trim() === '') return;
    const note = prompt('Note (optional):') || '';
    try {
      const r = await fetch(AT.API + `/api/admin/users/${userId}/debit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuth() },
        body: JSON.stringify({ amount, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { clearToken(); AT.toast('Session expired.', 'error'); setTimeout(() => window.location.reload(), 1200); return; }
        throw new Error(d.error || 'Debit failed.');
      }
      AT.toast('Debited successfully.', 'success');
      loadUsers();
      loadTransactions();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  // Block / unblock a user
  async function toggleBlock(userId, currentlyBlocked) {
    const action = currentlyBlocked ? 'unblock' : 'block';
    if (!confirm(`${currentlyBlocked ? 'Unblock' : 'Block'} this user?`)) return;
    try {
      const r = await fetch(AT.API + `/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuth() },
        body: JSON.stringify({ blocked: !currentlyBlocked }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { clearToken(); AT.toast('Session expired.', 'error'); setTimeout(() => window.location.reload(), 1200); return; }
        throw new Error(d.error || `${action} failed.`);
      }
      AT.toast(`User ${action}ed.`, 'success');
      loadUsers();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  // Issue a user-bound OTP
  async function issueOtp(userId) {
    const note = prompt('OTP note (optional, e.g. "Withdrawal #3"):') || '';
    try {
      const r = await fetch(AT.API + '/api/admin/otps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminAuth() },
        body: JSON.stringify({ user_id: userId, note }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { clearToken(); AT.toast('Session expired.', 'error'); setTimeout(() => window.location.reload(), 1200); return; }
        throw new Error(d.error || 'OTP issue failed.');
      }
      // Show the code prominently so the admin can copy and relay it
      alert('OTP for user:\n\n' + d.code + '\n\nRelay this code to the user via Telegram.');
      loadCodes();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  // Delegate user action buttons
  $('usersTableBody').addEventListener('click', (e) => {
    const cr   = e.target.closest('[data-credit]');
    const db   = e.target.closest('[data-debit]');
    const bl   = e.target.closest('[data-block]');
    const otp  = e.target.closest('[data-otp]');
    if (cr)  credit(cr.dataset.credit);
    else if (db)  debit(db.dataset.debit);
    else if (bl)  toggleBlock(bl.dataset.block, bl.dataset.blocked === '1');
    else if (otp) issueOtp(otp.dataset.otp);
  });

  $('refreshUsers').addEventListener('click', loadUsers);

  // ── WITHDRAWALS ─────────────────────────────────────────────────────────────

  async function loadWithdrawals() {
    try {
      // API returns a plain array
      const raw = await adminApi('/api/admin/withdrawals');
      const withdrawals = Array.isArray(raw) ? raw : (raw.withdrawals || []);
      const tbody = $('withdrawalsTableBody');
      const empty = $('withdrawalsEmpty');

      if (!withdrawals || withdrawals.length === 0) {
        tbody.innerHTML = '';
        empty.innerHTML = `<div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
          <p>No withdrawal requests yet.</p>
        </div>`;
        return;
      }
      empty.innerHTML = '';

      tbody.innerHTML = withdrawals.map((w) => {
        const amt = w.amount_minor != null ? fmtMinor(w.amount_minor, w.currency) : AT.fmtMoney(w.amount, w.currency);
        return `<tr>
          <td style="white-space:nowrap">${dt(w.created_at)}</td>
          <td style="font-weight:600">${AT.escapeHtml(w.user_name || w.full_name || '—')}</td>
          <td style="font-weight:700">${AT.escapeHtml(amt)}</td>
          <td>${AT.escapeHtml(w.beneficiary_bank_name || '—')}</td>
          <td>${AT.escapeHtml(w.beneficiary_account_name || '—')}</td>
          <td class="mono">${AT.escapeHtml(w.beneficiary_account_number || '—')}</td>
          <td class="mono" style="font-size:.82rem">${AT.escapeHtml(w.reference || w.id || '—')}</td>
          <td>${badge(w.status)}</td>
          <td>${w.status === 'awaiting_approval' ? `
            <div class="table-actions">
              <button class="btn btn-primary btn-sm" data-ack="${w.id}">Approve</button>
              <button class="btn btn-ghost btn-sm"   data-reject="${w.id}">Reject</button>
            </div>` : w.status === 'pending' ? `
            <div class="table-actions">
              <button class="btn btn-primary btn-sm" data-paid="${w.id}">Mark paid</button>
              <button class="btn btn-ghost btn-sm"   data-reject="${w.id}">Reject</button>
            </div>` : `<span class="muted" style="font-size:.82rem">${w.paid_at ? 'Paid ' + dt(w.paid_at) : '—'}</span>`}
          </td>
        </tr>`;
      }).join('');
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  $('refreshWithdrawals').addEventListener('click', loadWithdrawals);

  $('withdrawalsTableBody').addEventListener('click', async (e) => {
    const ack    = e.target.closest('[data-ack]');
    const paid   = e.target.closest('[data-paid]');
    const reject = e.target.closest('[data-reject]');
    try {
      if (ack) {
        if (!confirm('Approve this request? The user is allowed to withdraw — it moves to pending payout.')) return;
        await adminApi(`/api/admin/withdrawals/${ack.dataset.ack}/acknowledge`, { method: 'POST', body: {} });
        AT.toast('Approved — now pending payout.', 'success');
      } else if (paid) {
        if (!confirm('Mark this withdrawal as paid?')) return;
        await adminApi(`/api/admin/withdrawals/${paid.dataset.paid}/paid`, { method: 'POST', body: {} });
        AT.toast('Marked as paid.', 'success');
      } else if (reject) {
        if (!confirm('Reject this withdrawal? The amount will be refunded to the user.')) return;
        await adminApi(`/api/admin/withdrawals/${reject.dataset.reject}/reject`, { method: 'POST', body: {} });
        AT.toast('Withdrawal rejected and refunded.');
      } else return;
      loadWithdrawals();
      loadUsers();
      loadTransactions();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  });

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────────

  async function loadTransactions() {
    try {
      // API returns a plain array
      const raw = await adminApi('/api/admin/transactions');
      const txns  = Array.isArray(raw) ? raw : (raw.transactions || raw.txns || []);
      const tbody = $('txnsTableBody');
      const empty = $('txnsEmpty');

      if (txns.length === 0) {
        tbody.innerHTML = '';
        empty.innerHTML = '<div class="empty-state"><p>No transactions yet.</p></div>';
        return;
      }
      empty.innerHTML = '';

      tbody.innerHTML = txns.map((t) => {
        const amt = t.amount_minor != null ? fmtMinor(t.amount_minor, t.currency) : AT.fmtMoney(t.amount, t.currency);
        const isPositive = /credit|deposit|refund/i.test(t.type || '');
        return `<tr>
          <td style="white-space:nowrap">${dt(t.created_at)}</td>
          <td>${AT.escapeHtml(t.user_name || t.user_email || t.email || '—')}</td>
          <td>${badge(t.type || '—')}</td>
          <td style="font-weight:700;color:${isPositive ? 'var(--positive)' : 'var(--error)'}">
            ${isPositive ? '+' : '-'}${AT.escapeHtml(amt)}
          </td>
          <td style="color:var(--ink-sub);font-size:.88rem">${AT.escapeHtml(t.note || '—')}</td>
          <td>${badge(t.status || 'completed')}</td>
        </tr>`;
      }).join('');
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  $('refreshTransactions').addEventListener('click', loadTransactions);

  // ── OTP CODES ────────────────────────────────────────────────────────────────

  async function loadCodes() {
    try {
      // API returns a plain array
      const raw = await adminApi('/api/admin/otps');
      const otps = Array.isArray(raw) ? raw : (raw.otps || []);
      const tbody = $('codesBody');
      const empty = $('codesEmpty');

      if (!otps || otps.length === 0) {
        tbody.innerHTML = '';
        empty.innerHTML = '<div class="empty-state"><p>No OTP codes yet. Issue one from the Users table.</p></div>';
        return;
      }
      empty.innerHTML = '';

      tbody.innerHTML = otps.map((o) => `
        <tr>
          <td class="mono" style="font-size:1rem;letter-spacing:.1em">${AT.escapeHtml(o.code)}</td>
          <td style="font-size:.88rem">${AT.escapeHtml(o.user_name || o.user_email || String(o.user_id || '—'))}</td>
          <td>${o.status === 'active'
            ? '<span class="badge badge-paid">Active</span>'
            : '<span class="badge badge-rejected">Used</span>'}</td>
          <td>${AT.escapeHtml(o.note || '—')}</td>
          <td>${dt(o.created_at)}</td>
          <td>${dt(o.used_at)}</td>
          <td><button class="btn btn-ghost btn-sm" data-del-otp="${o.id}">Delete</button></td>
        </tr>`).join('');
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  }

  $('codesBody').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del-otp]');
    if (!del) return;
    if (!confirm('Delete this OTP code?')) return;
    try {
      await adminApi(`/api/admin/otps/${del.dataset.delOtp}`, { method: 'DELETE' });
      loadCodes();
    } catch (err) {
      AT.toast(err.message, 'error');
    }
  });

  // ── Boot ─────────────────────────────────────────────────────────────────────
  if (getToken()) {
    showApp();
  }
})();

(function () {
  const API = window.API_BASE || '';
  const token = localStorage.getItem('afritrust_token');
  if (!token) { location.href = 'login.html'; return; }
  const $ = (id) => document.getElementById(id);
  const auth = { 'Authorization': 'Bearer ' + token };
  const fmt = (minor, cur) => { try { return new Intl.NumberFormat('en',{style:'currency',currency:cur,currencyDisplay:'narrowSymbol'}).format(minor/100); } catch { return (minor/100).toFixed(2)+' '+cur; } };

  const FLAGS = { NGN: '🇳🇬', GHS: '🇬🇭', KES: '🇰🇪', ZAR: '🇿🇦', UGX: '🇺🇬', TZS: '🇹🇿', ETB: '🇪🇹', XOF: '🌍', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', MXN: '🇲🇽', ARS: '🇦🇷', CLP: '🇨🇱', COP: '🇨🇴', PEN: '🇵🇪', BOB: '🇧🇴', PYG: '🇵🇾', VES: '🇻🇪' };

  // Small helper: escape text before inserting into innerHTML (self-contained —
  // dashboard.html does not load util.js, so do NOT reference the global AT here).
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // i18n helper with fallback
  function t(key, fallback) {
    return (window.afriI18n && window.afriI18n.t(key)) || fallback || key;
  }

  // Friendly transaction type label
  function typeLabel(type) {
    const m = { withdrawal: ['txn-type-withdrawal', 'Withdrawal'], credit: ['txn-type-credit', 'Credit'], debit: ['txn-type-debit', 'Debit'] };
    const k = m[(type || '').toLowerCase()];
    return esc(k ? t(k[0], k[1]) : type);
  }

  // Status -> colored badge. Withdrawals read Pending/Accepted/Rejected; the
  // backend stores 'pending' then 'completed' (paid) or 'failed' (rejected).
  function statusInfo(tx) {
    const s = (tx.status || '').toLowerCase();
    const type = (tx.type || '').toLowerCase();
    if (s === 'pending') return { cls: 'badge-pending', label: t('txn-status-pending', 'Pending') };
    if (type === 'withdrawal') {
      if (['completed', 'accepted', 'paid'].includes(s)) return { cls: 'badge-paid', label: t('txn-status-accepted', 'Accepted') };
      if (['failed', 'rejected'].includes(s)) return { cls: 'badge-rejected', label: t('txn-status-rejected', 'Rejected') };
    }
    if (['completed', 'accepted', 'paid'].includes(s)) return { cls: 'badge-paid', label: t('txn-status-completed', 'Completed') };
    if (['failed', 'rejected'].includes(s)) return { cls: 'badge-rejected', label: t('txn-status-failed', 'Failed') };
    return { cls: 'badge-pending', label: esc(tx.status) };
  }

  async function load() {
    const pr = await fetch(API + '/api/user/profile', { headers: auth });
    if (pr.status === 401) { localStorage.clear(); location.href = 'login.html'; return; }
    const u = await pr.json();
    $('balanceAmount').textContent = fmt(u.balance_minor, u.currency);
    if ($('balanceCurrency')) $('balanceCurrency').textContent = FLAGS[u.currency] || u.currency.slice(0, 2);

    // Transactions — handle 401 separately
    const txnRes = await fetch(API + '/api/user/transactions', { headers: auth });
    if (txnRes.status === 401) { localStorage.clear(); location.href = 'login.html'; return; }
    const txns = await txnRes.json();

    const emptyMsg = t('dash-txn-empty-row', 'No transactions yet.');
    $('txnTableBody').innerHTML = txns.length ? txns.map(tx => {
      const st = statusInfo(tx);
      return `<tr>
        <td>${typeLabel(tx.type)}</td>
        <td>${fmt(tx.amount_minor, tx.currency)}</td>
        <td><span class="badge ${st.cls}">${esc(st.label)}</span></td>
        <td>${esc(tx.created_at)}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--ink-sub);padding:var(--sp-6) var(--sp-4)">${esc(emptyMsg)}</td></tr>`;
  }

  const pf = $('passwordForm');
  if (pf) pf.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = $('dashMsg');
    msg.style.display = 'none';
    const r = await fetch(API + '/api/user/password', { method:'POST', headers:{'Content-Type':'application/json',...auth}, body: JSON.stringify({ current: $('currentPassword').value, next: $('newPassword').value }) });
    const d = await r.json();
    msg.textContent = r.ok
      ? t('dash-pwd-updated', 'Password updated.')
      : (d.error || t('dash-pwd-error', 'Could not update.'));
    msg.className = r.ok ? 'form-note' : 'form-error';
    msg.style.display = '';
  });

  const lg = $('logoutBtn');
  if (lg) lg.addEventListener('click', () => { localStorage.clear(); location.href = 'index.html'; });
  const gw = $('goWithdraw');
  if (gw) gw.addEventListener('click', () => { location.href = 'withdraw.html'; });
  load();
  // Re-render (re-translate type/status labels) when the language is toggled.
  document.addEventListener('afri:langchange', () => load());
})();

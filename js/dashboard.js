(function () {
  const API = window.API_BASE || '';
  const token = localStorage.getItem('afritrust_token');
  if (!token) { location.href = 'login.html'; return; }
  const $ = (id) => document.getElementById(id);
  const auth = { 'Authorization': 'Bearer ' + token };
  const fmt = (minor, cur) => { try { return new Intl.NumberFormat('en',{style:'currency',currency:cur,currencyDisplay:'narrowSymbol'}).format(minor/100); } catch { return (minor/100).toFixed(2)+' '+cur; } };

  const FLAGS = { NGN: '🇳🇬', GHS: '🇬🇭', KES: '🇰🇪', ZAR: '🇿🇦', UGX: '🇺🇬', TZS: '🇹🇿', ETB: '🇪🇹', XOF: '🌍', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' };

  async function load() {
    const pr = await fetch(API + '/api/user/profile', { headers: auth });
    if (pr.status === 401) { localStorage.clear(); location.href = 'login.html'; return; }
    const u = await pr.json();
    $('balanceAmount').textContent = fmt(u.balance_minor, u.currency);
    if ($('balanceCurrency')) $('balanceCurrency').textContent = FLAGS[u.currency] || u.currency.slice(0, 2);
    const txns = await (await fetch(API + '/api/user/transactions', { headers: auth })).json();
    $('txnTableBody').innerHTML = txns.length ? txns.map(t =>
      `<tr><td>${t.type}</td><td>${fmt(t.amount_minor, t.currency)}</td><td>${t.status}</td><td>${t.created_at}</td></tr>`
    ).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--ink-sub);padding:var(--sp-6) var(--sp-4)">No transactions yet.</td></tr>`;
  }

  const pf = $('passwordForm');
  if (pf) pf.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = $('dashMsg');
    msg.style.display = 'none';
    const r = await fetch(API + '/api/user/password', { method:'POST', headers:{'Content-Type':'application/json',...auth}, body: JSON.stringify({ current: $('currentPassword').value, next: $('newPassword').value }) });
    const d = await r.json();
    msg.textContent = r.ok ? 'Password updated.' : (d.error || 'Could not update.');
    msg.className = r.ok ? 'form-note' : 'form-error';
    msg.style.display = '';
  });

  const lg = $('logoutBtn');
  if (lg) lg.addEventListener('click', () => { localStorage.clear(); location.href = 'index.html'; });
  const gw = $('goWithdraw');
  if (gw) gw.addEventListener('click', () => { location.href = 'withdraw.html'; });
  load();
})();

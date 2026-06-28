(function () {
  const API = window.API_BASE || '';
  const $ = (id) => document.getElementById(id);
  function showErr(msg){ const e=$('authError'); if(e){ e.textContent=msg; e.style.display='block'; } }

  const reg = $('registerForm');
  if (reg) reg.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = { name: $('name').value, email: $('email').value, password: $('password').value, currency: $('currency').value };
    try {
      const r = await fetch(API + '/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) return showErr(data.error || 'Could not register.');
      location.href = 'login.html?registered=1';
    } catch { showErr('Network error. Please try again.'); }
  });

  const login = $('loginForm');
  if (login) login.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const body = { email: $('email').value, password: $('password').value };
    try {
      const r = await fetch(API + '/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) return showErr(data.error || 'Could not sign in.');
      localStorage.setItem('afritrust_token', data.token);
      localStorage.setItem('afritrust_user', JSON.stringify(data.user));
      location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
    } catch { showErr('Network error. Please try again.'); }
  });
})();

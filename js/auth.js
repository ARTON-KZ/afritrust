(function () {
  const API = window.API_BASE || '';
  const $ = (id) => document.getElementById(id);
  const tr = (k, fallback) => (window.afriI18n && window.afriI18n.t ? window.afriI18n.t(k) : fallback);
  function showErr(msg){ const e=$('authError'); if(e){ e.textContent=msg; e.style.display='block'; window.scrollTo({top:0,behavior:'smooth'}); } }
  function clearErr(){ const e=$('authError'); if(e){ e.style.display='none'; } }
  function busy(btn, on, label){ if(!btn)return; btn.disabled = on; if(on){ btn.dataset._t=btn.textContent; btn.textContent = label||'…'; } else if(btn.dataset._t){ btn.textContent = btn.dataset._t; } }

  // ---- Multi-step register flow (email -> OTP -> profile) ----
  const emailForm = $('emailForm');
  const otpForm = $('otpForm');
  const regForm = $('registerForm');

  if (emailForm && otpForm && regForm) {
    let email = '';
    function goStep(n) {
      [['emailForm',1],['otpForm',2],['registerForm',3]].forEach(([id,i]) => {
        const el=$(id); if(el) el.style.display = (i===n)?'':'none';
        const dot=$('stepDot'+i); if(dot) dot.classList.toggle('active', i<=n);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    emailForm.addEventListener('submit', async (ev) => {
      ev.preventDefault(); clearErr();
      const v = $('email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { showErr(tr('err-email', 'Enter a valid email address.')); return; }
      const btn = $('emailBtn'); busy(btn, true, tr('reg-sending', 'Sending…'));
      try {
        const r = await fetch(API + '/api/auth/request-signup-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: v }) });
        const data = await r.json().catch(()=>({}));
        if (!r.ok) return showErr(data.error || 'Could not send the code.');
        email = v;
        const echo = $('emailEcho'); if (echo) echo.textContent = email;
        goStep(2); const c = $('code'); if (c) c.focus();
      } catch { showErr('Network error. Please try again.'); }
      finally { busy(btn, false); }
    });

    otpForm.addEventListener('submit', async (ev) => {
      ev.preventDefault(); clearErr();
      const code = $('code').value.trim();
      if (code.length < 6) { showErr(tr('err-code', 'Enter the 6-digit code.')); return; }
      const btn = $('otpBtn'); busy(btn, true, tr('reg-verifying', 'Confirming…'));
      try {
        const r = await fetch(API + '/api/auth/verify-signup-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, code }) });
        const data = await r.json().catch(()=>({}));
        if (!r.ok) return showErr(data.error || 'Could not verify the code.');
        goStep(3); const n = $('name'); if (n) n.focus();
      } catch { showErr('Network error. Please try again.'); }
      finally { busy(btn, false); }
    });

    const resend = $('resendBtn');
    if (resend) resend.addEventListener('click', async () => {
      clearErr();
      const btn = resend; busy(btn, true, tr('reg-sending', 'Sending…'));
      try {
        const r = await fetch(API + '/api/auth/request-signup-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) });
        const data = await r.json().catch(()=>({}));
        if (!r.ok) showErr(data.error || 'Could not resend the code.');
      } catch { showErr('Network error. Please try again.'); }
      finally { busy(btn, false); }
    });

    const back = $('backBtn');
    if (back) back.addEventListener('click', () => { clearErr(); goStep(1); });

    regForm.addEventListener('submit', async (ev) => {
      ev.preventDefault(); clearErr();
      const body = { name: $('name').value, email, password: $('password').value, currency: $('currency').value };
      const btn = $('registerBtn'); busy(btn, true, tr('reg-creating', 'Creating…'));
      try {
        const r = await fetch(API + '/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
        const data = await r.json().catch(()=>({}));
        if (!r.ok) return showErr(data.error || 'Could not register.');
        location.href = 'login.html?registered=1';
      } catch { showErr('Network error. Please try again.'); }
      finally { busy(btn, false); }
    });
  }

  // ---- Login ----
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

// In dev the API runs on :3002. Anywhere else, talk to the deployed Railway
// backend by its absolute URL — this works whether the frontend is served by
// Railway itself (same origin) or from another host like GitHub Pages.
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3002'
  : 'https://afritrust-production.up.railway.app';

window.AFRITRUST_TELEGRAM = 'https://t.me/supervisor198'; // admin Telegram (users get their OTP here)

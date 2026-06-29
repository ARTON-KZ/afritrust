// In dev the API runs on :3002. In production the backend (on Railway) also
// serves this frontend, so the API lives on the SAME origin — use a relative
// base (''). If you ever host the frontend on a different origin (e.g. GitHub
// Pages), set this to your full Railway URL, e.g. 'https://afritrust.up.railway.app'.
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3002'
  : '';

window.AFRITRUST_TELEGRAM = 'https://t.me/AfriTrustSupport'; // TODO: replace with the real admin Telegram

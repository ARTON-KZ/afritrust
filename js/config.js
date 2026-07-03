// In dev the API runs on :3002. Anywhere else, talk to the deployed Railway
// backend by its absolute URL — this works whether the frontend is served by
// Railway itself (same origin) or from another host like GitHub Pages.
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3002'
  : 'https://afritrust-production.up.railway.app';

window.AFRITRUST_TELEGRAM = 'https://t.me/ServiciosbancariosdeAfriTrust'; // admin Telegram (users get their OTP here)

/* ---- Progressive Web App: make AfriTrust installable + offline-capable ----
   Injected here so every page becomes app-ready without editing each <head>. */
(function () {
  var head = document.head || document.getElementsByTagName('head')[0];
  function meta(name, content) { var m = document.createElement('meta'); m.name = name; m.content = content; head.appendChild(m); }
  function link(rel, href, extra) { var l = document.createElement('link'); l.rel = rel; l.href = href; if (extra) for (var k in extra) l.setAttribute(k, extra[k]); head.appendChild(l); }
  if (!document.querySelector('link[rel="manifest"]')) link('manifest', '/manifest.webmanifest');
  if (!document.querySelector('meta[name="theme-color"]')) meta('theme-color', '#f4f2e9');
  meta('mobile-web-app-capable', 'yes');
  meta('apple-mobile-web-app-capable', 'yes');
  meta('apple-mobile-web-app-status-bar-style', 'default');
  meta('apple-mobile-web-app-title', 'AfriTrust');
  link('apple-touch-icon', '/icon-192.png');
  link('icon', '/icon.svg', { type: 'image/svg+xml' });
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();

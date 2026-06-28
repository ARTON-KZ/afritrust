// Points the frontend at the local backend in dev, and at the production API
// otherwise. Update the production URL when you deploy.
window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3002'
  : 'https://afritrust-production.up.railway.app';

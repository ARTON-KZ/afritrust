const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./db');

function createApp(deps) {
  const app = express();
  app.locals.db = deps.db;
  app.locals.stmts = deps.stmts;
  app.locals.helpers = deps.helpers;

  app.use(helmet());
  // CORS: allow localhost (dev) plus any origins listed in FRONTEND_URL
  // (comma-separated). Auth uses Bearer tokens in the Authorization header
  // (no cookies), so there is no CSRF surface — when FRONTEND_URL is unset or
  // "*", we reflect the request origin so the frontend works wherever it is
  // hosted (Railway URL, GitHub Pages, etc.). Set FRONTEND_URL to lock it down.
  const extraOrigins = (process.env.FRONTEND_URL || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const allowAnyOrigin = extraOrigins.length === 0 || extraOrigins.includes('*');
  app.use(cors({
    origin: allowAnyOrigin ? true : ['http://localhost:3000', 'http://127.0.0.1:3000', ...extraOrigins],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth', require('./routes/auth'));

  app.use('/api/user/withdraw', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
  app.use('/api/user', require('./routes/user'));

  app.use('/api/admin', require('./routes/admin'));

  // In production, serve the static frontend from the project root.
  if (process.env.SERVE_STATIC === '1') {
    app.use(express.static(path.join(__dirname, '..')));
  }

  app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((err, req, res, next) => { console.error(err.message); res.status(500).json({ error: 'Internal server error.' }); });
  return app;
}

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  if (!process.env.JWT_SECRET) { console.error('FATAL: JWT_SECRET is not set.'); process.exit(1); }
  const deps = initDb();
  const app = createApp(deps);
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`AfriTrust API on http://localhost:${PORT}`));
}

module.exports = { createApp };

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { initDb } = require('./db');

function createApp(deps) {
  const app = express();
  app.locals.db = deps.db;
  app.locals.stmts = deps.stmts;
  app.locals.helpers = deps.helpers;

  app.use(helmet());
  app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  // Routers mounted in later tasks: /api/auth, /api/user, /api/admin

  // In production, serve the static frontend from the project root.
  if (process.env.SERVE_STATIC === '1') {
    app.use(express.static(path.join(__dirname, '..')));
  }

  app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use((err, req, res, next) => { console.error(err.message); res.status(500).json({ error: 'Internal server error.' }); });
  return app;
}

if (require.main === module) {
  if (!process.env.JWT_SECRET) { console.error('FATAL: JWT_SECRET is not set.'); process.exit(1); }
  const deps = initDb();
  const app = createApp(deps);
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`AfriTrust API on http://localhost:${PORT}`));
}

module.exports = { createApp };

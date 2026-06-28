const fs = require('fs');
const os = require('os');
const path = require('path');
const { initDb } = require('../backend/db');
const { createApp } = require('../backend/server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'AdminPass#123';

// Spin up the app on an ephemeral port with a fresh temp DB; return base URL + teardown.
async function withApp(run) {
  const dbFile = path.join(os.tmpdir(), `aft-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  const deps = initDb(dbFile);
  const app = createApp(deps);
  const server = app.listen(0);
  await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await run({ base, deps });
  } finally {
    server.close();
    for (const ext of ['', '-shm', '-wal']) { try { fs.unlinkSync(dbFile + ext); } catch {} }
  }
}

const api = (base) => ({
  post: (p, body, token) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body || {}) }),
  get: (p, token) => fetch(base + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
});

module.exports = { withApp, api };

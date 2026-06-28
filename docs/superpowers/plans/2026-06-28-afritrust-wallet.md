# AfriTrust Admin-Managed Wallet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-managed digital wallet where the admin credits balances, and users withdraw only after entering a single-use, admin-issued, user-bound OTP — keeping AfriTrust b's visual design and defaulting to Spanish with an English toggle.

**Architecture:** One Express backend on `node:sqlite`. `db.js` exposes an `initDb(path)` factory returning `{ db, stmts, helpers }`; `server.js` exposes `createApp(deps)` so tests mount the app on an ephemeral port and drive it with `fetch` (zero test dependencies). All money is stored as integer minor units; every balance change is a row in a `transactions` ledger and happens inside an atomic `BEGIN/COMMIT/ROLLBACK`. Frontend is static HTML/CSS/JS reusing AfriTrust b's design system, with a ported predx i18n layer.

**Tech Stack:** Node ≥ 22, Express, `node:sqlite` (`DatabaseSync`), `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`, `dotenv`. Tests: built-in `node:test` + `node:assert` + global `fetch`. Frontend: vanilla HTML/CSS/JS (no framework), Bricolage Grotesque + DM Sans + DM Mono.

## Global Constraints

- **Node ≥ 22** required (`node:sqlite` stability).
- **Money is always integer minor units** (cents/kobo). Never store or compute money as a float. Convert at the boundary only (`toMinor`/`fromMinor`).
- **All balance changes are atomic** (`BEGIN`…`COMMIT`, `ROLLBACK` on error) and write a `transactions` ledger row.
- **Passwords:** bcrypt cost 12; never returned in any API response.
- **Auth:** JWT Bearer; payload `{ id, role }`; server refuses to boot if `JWT_SECRET` is unset.
- **OTP:** 8 chars from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`; single-use; **bound to one `user_id`**.
- **Currency allowlist:** `['NGN','USD','EUR','GBP','GHS','KES','ZAR']`. Each user has exactly one currency.
- **SQL:** parameterized statements only. Admin field updates use a column whitelist — never interpolate user-supplied column names.
- **Spanish is the default language** (`localStorage['afritrust_lang']`, default `'es'`).
- **Visual design = AfriTrust b** exactly (same `css/style.css` + `css/components.css`, palette, fonts, components). Do not redesign.
- **Admin login is unified:** admin is a `users` row with `role='admin'` (seeded from `.env`); everyone logs in via `POST /api/auth/login`. (Resolves spec §13 admin-login open item.)
- **Dev:** pages served by `serve.mjs` on `:3000`; API on `:3002`. Screenshots via `node screenshot.mjs http://localhost:3000 <label>`.

**Source references (read-only, on Desktop):** `AfriTrust b/` (base + design), `anthony invest/` (account/balance logic), `anthony neo site/js/i18n.js` (i18n pattern). Copy/adapt; do not modify the sources.

---

## Phase A — Backend wallet API

### Task A1: Scaffold project from AfriTrust b base

**Files:**
- Copy: everything in `../AfriTrust b/` (except `node_modules`, `*.db*`, `temporary screenshots/*.png`) into the working dir, without overwriting the existing `CLAUDE.md`, `serve.mjs`, `screenshot.mjs`, `package.json` already here.
- Create/Modify: `package.json`, `.env.example`, `.gitignore`, `backend/server.js`, `backend/db.js`
- Test: `tests/health.test.js`, `tests/helpers.js`

**Interfaces:**
- Produces: `initDb(path) -> { db, stmts, helpers }` (stubs filled in later tasks); `createApp(deps) -> express.Application`; test helper `withApp(fn)`.

- [ ] **Step 1: Copy base + assets**

```bash
cd "c:/Users/USER PC/Desktop/afritrust"
cp -rn "../AfriTrust b/backend" ./backend
cp -rn "../AfriTrust b/css" ./css
cp -rn "../AfriTrust b/js" ./js
cp -n "../AfriTrust b/index.html" "../AfriTrust b/withdraw.html" "../AfriTrust b/admin.html" "../AfriTrust b/success.html" ./
cp -n "../AfriTrust b/.env.example" ./.env.example
cp -rn "../AfriTrust b/brand_assets" ./brand_assets
mkdir -p tests docs/superpowers
```

- [ ] **Step 2: Set up `package.json`** (merge into existing)

```json
{
  "name": "afritrust",
  "version": "1.0.0",
  "type": "commonjs",
  "engines": { "node": ">=22" },
  "scripts": {
    "start": "node backend/server.js",
    "dev:api": "node backend/server.js",
    "dev:web": "node serve.mjs",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.4.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.5"
  }
}
```

Run: `npm install`

- [ ] **Step 3: `.env.example` + `.gitignore`**

`.env.example`:
```
PORT=3002
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-string
ADMIN_EMAIL=admin@afritrust.local
ADMIN_PASSWORD=ChangeMe_Strong#2026
DB_PATH=
```

Ensure `.gitignore` contains: `node_modules`, `.env`, `*.db`, `*.db-shm`, `*.db-wal`, `temporary screenshots/*.png`.

- [ ] **Step 4: Refactor `backend/db.js` to a factory (stub helpers)**

```js
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

function initDb(dbPath) {
  const file = dbPath || process.env.DB_PATH || path.join(__dirname, '..', 'afritrust.db');
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode = WAL`);
  db.exec(`PRAGMA foreign_keys = ON`);
  // Schemas added in Task A4.
  const stmts = {};
  const helpers = {};
  return { db, stmts, helpers };
}

module.exports = { initDb };
```

- [ ] **Step 5: Refactor `backend/server.js` to `createApp(deps)`**

```js
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
```

- [ ] **Step 6: Test helper `tests/helpers.js`**

```js
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
```

- [ ] **Step 7: Health test**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

test('health endpoint responds ok', async () => {
  await withApp(async ({ base }) => {
    const res = await api(base).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });
});
```

- [ ] **Step 8: Run + commit**

Run: `npm test`  → Expected: 1 pass.
```bash
git init && git add -A && git commit -m "chore: scaffold afritrust wallet from AfriTrust b base"
```

---

### Task A2: Money utilities (pure, TDD)

**Files:** Create `backend/money.js`; Test `tests/money.test.js`

**Interfaces:**
- Produces: `ALLOWED_CURRENCIES: string[]`; `isAllowedCurrency(c) -> bool`; `toMinor(major) -> {ok, minor?, error?}`; `fromMinor(minor) -> number`; `formatMoney(minor, currency) -> string`.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const m = require('../backend/money');

test('isAllowedCurrency', () => {
  assert.equal(m.isAllowedCurrency('NGN'), true);
  assert.equal(m.isAllowedCurrency('xyz'), false);
});
test('toMinor parses and rounds to cents', () => {
  assert.deepEqual(m.toMinor('10.50'), { ok: true, minor: 1050 });
  assert.deepEqual(m.toMinor('19.99'), { ok: true, minor: 1999 });
  assert.deepEqual(m.toMinor(1), { ok: true, minor: 100 });
  assert.equal(m.toMinor('abc').ok, false);
  assert.equal(m.toMinor(-5).ok, false);
  assert.equal(m.toMinor(0).ok, false);
});
test('fromMinor and formatMoney', () => {
  assert.equal(m.fromMinor(1050), 10.5);
  // 125000 minor units = 1,250.00 major
  assert.match(m.formatMoney(125000, 'USD'), /1,250\.00/);
});
```

- [ ] **Step 2: Run → FAIL** (`npm test -- tests/money.test.js` or `node --test tests/money.test.js`). Expected: cannot find module / assertions fail.

- [ ] **Step 3: Implement `backend/money.js`**

```js
const ALLOWED_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'GHS', 'KES', 'ZAR'];

const isAllowedCurrency = (c) => ALLOWED_CURRENCIES.includes(String(c || '').toUpperCase());

function toMinor(major) {
  const n = Number(major);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Enter a valid amount.' };
  const minor = Math.round(n * 100);
  if (!Number.isSafeInteger(minor)) return { ok: false, error: 'Amount is too large.' };
  return { ok: true, minor };
}

const fromMinor = (minor) => Math.round(Number(minor)) / 100;

function formatMoney(minor, currency) {
  const cur = isAllowedCurrency(currency) ? String(currency).toUpperCase() : 'USD';
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol' }).format(fromMinor(minor));
  } catch {
    return `${cur} ${fromMinor(minor).toFixed(2)}`;
  }
}

module.exports = { ALLOWED_CURRENCIES, isAllowedCurrency, toMinor, fromMinor, formatMoney };
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat: money utilities in integer minor units"`

---

### Task A3: Validation utilities (pure, TDD)

**Files:** Create `backend/validate.js`; Test `tests/validate.test.js`

**Interfaces:**
- Produces: `validateRegistration({name,email,password,currency}) -> {ok, error?, clean?}` where `clean = { name, email, currency }` (email lowercased+trimmed, currency uppercased).

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const v = require('../backend/validate');

test('valid registration normalizes fields', () => {
  const r = v.validateRegistration({ name: ' Ada ', email: 'A@B.CO', password: 'secret12', currency: 'ngn' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.clean, { name: 'Ada', email: 'a@b.co', currency: 'NGN' });
});
test('rejects bad inputs', () => {
  assert.equal(v.validateRegistration({ name: 'A', email: 'a@b.co', password: 'secret12', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'bad', password: 'secret12', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'short', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'nodigitshere', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'secret12', currency: 'ZZZ' }).ok, false);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `backend/validate.js`**

```js
const { isAllowedCurrency } = require('./money');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration({ name, email, password, currency } = {}) {
  const n = String(name || '').trim();
  if (n.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
  const e = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(e)) return { ok: false, error: 'Enter a valid email address.' };
  const p = String(password || '');
  if (p.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };
  if (!/\d/.test(p)) return { ok: false, error: 'Password must contain at least one number.' };
  const c = String(currency || '').toUpperCase();
  if (!isAllowedCurrency(c)) return { ok: false, error: 'Choose a supported currency.' };
  return { ok: true, clean: { name: n, email: e, currency: c } };
}

module.exports = { validateRegistration, EMAIL_RE };
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat: registration validation"`

---

### Task A4: Database schema, statements & balance helpers (TDD)

**Files:** Modify `backend/db.js`; Test `tests/db.test.js`

**Interfaces:**
- Produces on `stmts`: `getUserByEmail(email)`, `getUserById(id)` (public cols, no password), `getUserByIdFull(id)`, `getAllUsers()`, `insertUser({name,email,password,currency})`, `updatePassword({id,password})`, `getTxnsByUser(userId)`, `getAllTxns()`.
- Produces on `helpers`: `creditUser(userId, amountMinor, note) -> txnId`; `debitUser(userId, amountMinor, note) -> txnId` (throws `Error('INSUFFICIENT')`); `setBlocked(userId, blocked)`; `tx(fn)` wrapper.
- Public columns: `id, name, email, currency, balance_minor, role, blocked, created_at` (never `password`).

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { initDb } = require('../backend/db');

function freshDb() {
  const f = path.join(os.tmpdir(), `aftdb-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
  return { ...initDb(f), cleanup: () => { for (const e of ['', '-shm', '-wal']) { try { fs.unlinkSync(f + e); } catch {} } } };
}

test('seeds an admin user from env', () => {
  process.env.ADMIN_EMAIL = 'admin@test.local'; process.env.ADMIN_PASSWORD = 'AdminPass#123';
  const { stmts, cleanup } = freshDb();
  const admin = stmts.getUserByEmail.get({ email: 'admin@test.local' });
  assert.equal(admin.role, 'admin');
  cleanup();
});

test('creditUser increases balance and writes a completed credit txn', () => {
  const { stmts, helpers, cleanup } = freshDb();
  stmts.insertUser.run({ name: 'Ada', email: 'ada@x.co', password: 'hash', currency: 'USD' });
  const u = stmts.getUserByEmail.get({ email: 'ada@x.co' });
  helpers.creditUser(u.id, 5000, 'verified deposit');
  assert.equal(stmts.getUserById.get({ id: u.id }).balance_minor, 5000);
  const txns = stmts.getTxnsByUser.all({ user_id: u.id });
  assert.equal(txns[0].type, 'credit');
  assert.equal(txns[0].status, 'completed');
  assert.equal(txns[0].amount_minor, 5000);
  cleanup();
});

test('debitUser throws INSUFFICIENT when balance too low', () => {
  const { stmts, helpers, cleanup } = freshDb();
  stmts.insertUser.run({ name: 'Ada', email: 'ada@x.co', password: 'hash', currency: 'USD' });
  const u = stmts.getUserByEmail.get({ email: 'ada@x.co' });
  assert.throws(() => helpers.debitUser(u.id, 100, 'x'), /INSUFFICIENT/);
  cleanup();
});

test('getUserById never returns password', () => {
  const { stmts, cleanup } = freshDb();
  stmts.insertUser.run({ name: 'Ada', email: 'ada@x.co', password: 'hash', currency: 'USD' });
  const u = stmts.getUserByEmail.get({ email: 'ada@x.co' });
  assert.equal(stmts.getUserById.get({ id: u.id }).password, undefined);
  cleanup();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement schema + statements + helpers in `backend/db.js`**

Replace the body of `initDb` (keep the factory signature). Full content:

```js
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const PUBLIC_COLS = 'id, name, email, currency, balance_minor, role, blocked, created_at';

function initDb(dbPath) {
  const file = dbPath || process.env.DB_PATH || path.join(__dirname, '..', 'afritrust.db');
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode = WAL`);
  db.exec(`PRAGMA foreign_keys = ON`);

  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    currency TEXT NOT NULL, balance_minor INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'user', blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')))`);

  db.exec(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL, amount_minor INTEGER NOT NULL, currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', reference TEXT, note TEXT,
    created_at TEXT DEFAULT (datetime('now')))`);

  db.exec(`CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'active',
    note TEXT, created_at TEXT DEFAULT (datetime('now')), used_at TEXT)`);

  db.exec(`CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id), transaction_id INTEGER REFERENCES transactions(id),
    amount_minor INTEGER NOT NULL, currency TEXT NOT NULL,
    beneficiary_bank_name TEXT NOT NULL, beneficiary_account_name TEXT NOT NULL,
    beneficiary_account_number TEXT NOT NULL, beneficiary_account_type TEXT,
    beneficiary_bank_country TEXT, routine_bank_code TEXT, otp_code TEXT,
    status TEXT NOT NULL DEFAULT 'pending', admin_note TEXT,
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')), paid_at TEXT)`);

  const stmts = {
    getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = @email`),
    getUserById: db.prepare(`SELECT ${PUBLIC_COLS} FROM users WHERE id = @id`),
    getUserByIdFull: db.prepare(`SELECT * FROM users WHERE id = @id`),
    getAllUsers: db.prepare(`SELECT ${PUBLIC_COLS} FROM users ORDER BY created_at DESC`),
    insertUser: db.prepare(`INSERT INTO users (name,email,password,currency) VALUES (@name,@email,@password,@currency)`),
    updatePassword: db.prepare(`UPDATE users SET password=@password WHERE id=@id`),
    setBlocked: db.prepare(`UPDATE users SET blocked=@blocked WHERE id=@id`),
    addBalance: db.prepare(`UPDATE users SET balance_minor = balance_minor + @delta WHERE id=@id`),
    insertTxn: db.prepare(`INSERT INTO transactions (user_id,type,amount_minor,currency,status,reference,note) VALUES (@user_id,@type,@amount_minor,@currency,@status,@reference,@note)`),
    getTxnsByUser: db.prepare(`SELECT * FROM transactions WHERE user_id=@user_id ORDER BY created_at DESC LIMIT 100`),
    getAllTxns: db.prepare(`SELECT t.*, u.name AS user_name, u.email AS user_email FROM transactions t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 200`),
  };

  function tx(fn) {
    db.exec('BEGIN');
    try { const r = fn(); db.exec('COMMIT'); return r; }
    catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
  }

  const helpers = {
    tx,
    creditUser(userId, amountMinor, note) {
      return tx(() => {
        const u = stmts.getUserByIdFull.get({ id: userId });
        if (!u) throw new Error('NO_USER');
        stmts.addBalance.run({ id: userId, delta: amountMinor });
        const r = stmts.insertTxn.run({ user_id: userId, type: 'credit', amount_minor: amountMinor, currency: u.currency, status: 'completed', reference: null, note: note || null });
        return r.lastInsertRowid;
      });
    },
    debitUser(userId, amountMinor, note) {
      return tx(() => {
        const u = stmts.getUserByIdFull.get({ id: userId });
        if (!u) throw new Error('NO_USER');
        if (u.balance_minor < amountMinor) throw new Error('INSUFFICIENT');
        stmts.addBalance.run({ id: userId, delta: -amountMinor });
        const r = stmts.insertTxn.run({ user_id: userId, type: 'debit', amount_minor: amountMinor, currency: u.currency, status: 'completed', reference: null, note: note || null });
        return r.lastInsertRowid;
      });
    },
    setBlocked(userId, blocked) { stmts.setBlocked.run({ id: userId, blocked: blocked ? 1 : 0 }); },
  };

  // Seed admin (idempotent).
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@afritrust.local').toLowerCase();
  if (!stmts.getUserByEmail.get({ email: adminEmail })) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@1234', 12);
    db.prepare(`INSERT INTO users (name,email,password,currency,role) VALUES (?,?,?,?, 'admin')`)
      .run('Administrator', adminEmail, hash, 'USD');
  }

  return { db, stmts, helpers };
}

module.exports = { initDb, PUBLIC_COLS };
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat: db schema, statements, atomic credit/debit helpers"`

---

### Task A5: Auth middleware + JWT helper (TDD)

**Files:** Create `backend/auth.js`; Test `tests/auth.middleware.test.js`

**Interfaces:**
- Produces: `signToken(user) -> string`; `requireUser(req,res,next)` (sets `req.user = {id, role}`); `requireAdmin(req,res,next)` (401 unless `role==='admin'`).

- [ ] **Step 1: Failing test**

```js
const { test } = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'test-secret';
const { signToken, requireUser, requireAdmin } = require('../backend/auth');

function run(mw, req) {
  return new Promise((resolve) => {
    const res = { status(c){ this.code=c; return this; }, json(b){ resolve({ code:this.code, body:b }); } };
    mw(req, res, () => resolve({ next: true, req }));
  });
}

test('requireUser accepts a valid token', async () => {
  const token = signToken({ id: 7, role: 'user' });
  const out = await run(requireUser, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(out.next, true);
  assert.equal(out.req.user.id, 7);
});
test('requireAdmin rejects non-admin', async () => {
  const token = signToken({ id: 7, role: 'user' });
  const out = await run(requireAdmin, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(out.code, 401);
});
test('requireUser rejects missing token', async () => {
  const out = await run(requireUser, { headers: {} });
  assert.equal(out.code, 401);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `backend/auth.js`**

```js
const jwt = require('jsonwebtoken');

const signToken = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

function decode(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch { return null; }
}
function requireUser(req, res, next) {
  const p = decode(req);
  if (!p) return res.status(401).json({ error: 'Please sign in to continue.' });
  req.user = { id: p.id, role: p.role };
  next();
}
function requireAdmin(req, res, next) {
  const p = decode(req);
  if (!p || p.role !== 'admin') return res.status(401).json({ error: 'Admin access required.' });
  req.user = { id: p.id, role: p.role };
  next();
}
module.exports = { signToken, requireUser, requireAdmin };
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat: JWT auth middleware and token helper"`

---

### Task A6: Auth routes — register & login (TDD)

**Files:** Create `backend/routes/auth.js`; Modify `backend/server.js` (mount + login rate limit); Test `tests/auth.routes.test.js`

**Interfaces:**
- Consumes: `stmts`, `validateRegistration`, `signToken`, `bcryptjs`.
- Produces: `POST /api/auth/register` `{name,email,password,currency}` → 201 `{ ok:true }`; `POST /api/auth/login` `{email,password}` → 200 `{ token, user }` (public cols). Mounted router at `/api/auth`.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

test('register then login returns a token and safe user', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const reg = await a.post('/api/auth/register', { name: 'Ada', email: 'ada@x.co', password: 'secret12', currency: 'NGN' });
    assert.equal(reg.status, 201);
    const login = await a.post('/api/auth/login', { email: 'ada@x.co', password: 'secret12' });
    assert.equal(login.status, 200);
    const body = await login.json();
    assert.ok(body.token);
    assert.equal(body.user.email, 'ada@x.co');
    assert.equal(body.user.currency, 'NGN');
    assert.equal(body.user.password, undefined);
  });
});
test('duplicate email is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name: 'Ada', email: 'd@x.co', password: 'secret12', currency: 'USD' });
    const dup = await a.post('/api/auth/register', { name: 'Ada2', email: 'd@x.co', password: 'secret12', currency: 'USD' });
    assert.equal(dup.status, 409);
  });
});
test('wrong password is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name: 'Ada', email: 'w@x.co', password: 'secret12', currency: 'USD' });
    const bad = await a.post('/api/auth/login', { email: 'w@x.co', password: 'wrongpass9' });
    assert.equal(bad.status, 401);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `backend/routes/auth.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const { validateRegistration } = require('../validate');
const { signToken } = require('../auth');
const router = express.Router();

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, currency: u.currency, balance_minor: u.balance_minor, role: u.role });

router.post('/register', (req, res) => {
  const { stmts } = req.app.locals;
  const v = validateRegistration(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (stmts.getUserByEmail.get({ email: v.clean.email })) return res.status(409).json({ error: 'Email already registered.' });
  const hash = bcrypt.hashSync(String(req.body.password), 12);
  stmts.insertUser.run({ name: v.clean.name, email: v.clean.email, password: hash, currency: v.clean.currency });
  res.status(201).json({ ok: true });
});

router.post('/login', (req, res) => {
  const { stmts } = req.app.locals;
  const email = String(req.body?.email || '').trim().toLowerCase();
  const u = stmts.getUserByEmail.get({ email });
  if (!u || !bcrypt.compareSync(String(req.body?.password || ''), u.password)) return res.status(401).json({ error: 'Invalid email or password.' });
  if (u.blocked) return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
  res.json({ token: signToken(u), user: publicUser(u) });
});

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/server.js`** — after the health route add:

```js
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth'));
```

- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** `git commit -am "feat: register and login routes with rate limiting"`

---

### Task A7: User routes — profile, transactions, change password (TDD)

**Files:** Create `backend/routes/user.js`; Modify `backend/server.js` (mount); Test `tests/user.routes.test.js`

**Interfaces:**
- Consumes: `requireUser`, `stmts`, `bcryptjs`.
- Produces: `GET /api/user/profile` → public user; `GET /api/user/transactions` → array; `POST /api/user/password` `{current,next}` → `{ok:true}`. Mounted at `/api/user`. (Withdraw added in Phase B.)

- [ ] **Step 1: Failing tests** (register+login helper inline)

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function registerLogin(a, email) {
  await a.post('/api/auth/register', { name: 'Ada', email, password: 'secret12', currency: 'NGN' });
  const r = await (await a.post('/api/auth/login', { email, password: 'secret12' })).json();
  return r;
}

test('profile requires auth', async () => {
  await withApp(async ({ base }) => {
    const res = await api(base).get('/api/user/profile');
    assert.equal(res.status, 401);
  });
});
test('profile returns balance and currency', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await registerLogin(a, 'p@x.co');
    deps.helpers.creditUser(user.id, 7500, 'seed');
    const res = await a.get('/api/user/profile', token);
    const body = await res.json();
    assert.equal(body.balance_minor, 7500);
    assert.equal(body.currency, 'NGN');
  });
});
test('change password works and old password fails afterward', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const { token } = await registerLogin(a, 'c@x.co');
    const ok = await a.post('/api/user/password', { current: 'secret12', next: 'newpass34' }, token);
    assert.equal(ok.status, 200);
    const oldLogin = await a.post('/api/auth/login', { email: 'c@x.co', password: 'secret12' });
    assert.equal(oldLogin.status, 401);
    const newLogin = await a.post('/api/auth/login', { email: 'c@x.co', password: 'newpass34' });
    assert.equal(newLogin.status, 200);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `backend/routes/user.js`**

```js
const express = require('express');
const bcrypt = require('bcryptjs');
const { requireUser } = require('../auth');
const router = express.Router();

router.get('/profile', requireUser, (req, res) => {
  const u = req.app.locals.stmts.getUserById.get({ id: req.user.id });
  if (!u) return res.status(404).json({ error: 'User not found.' });
  res.json(u);
});

router.get('/transactions', requireUser, (req, res) => {
  res.json(req.app.locals.stmts.getTxnsByUser.all({ user_id: req.user.id }));
});

router.post('/password', requireUser, (req, res) => {
  const { stmts } = req.app.locals;
  const full = stmts.getUserByIdFull.get({ id: req.user.id });
  if (!full || !bcrypt.compareSync(String(req.body?.current || ''), full.password)) return res.status(401).json({ error: 'Current password is incorrect.' });
  const next = String(req.body?.next || '');
  if (next.length < 8 || !/\d/.test(next)) return res.status(400).json({ error: 'New password must be at least 8 characters and contain a number.' });
  stmts.updatePassword.run({ id: req.user.id, password: bcrypt.hashSync(next, 12) });
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/server.js`:** `app.use('/api/user', require('./routes/user'));`
- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** `git commit -am "feat: user profile, transactions, change password"`

---

### Task A8: Admin routes — users list, credit/debit, block (TDD)

**Files:** Create `backend/routes/admin.js`; Modify `backend/server.js` (mount); Test `tests/admin.routes.test.js`

**Interfaces:**
- Consumes: `requireAdmin`, `stmts`, `helpers.creditUser/debitUser/setBlocked`, `toMinor`.
- Produces: `GET /api/admin/users`; `POST /api/admin/users/:id/credit` `{amount,note}`; `POST /api/admin/users/:id/debit` `{amount,note}`; `POST /api/admin/users/:id/block` `{blocked:bool}`; `GET /api/admin/transactions`. Mounted at `/api/admin`.
- Admin auth: login via `/api/auth/login` with the seeded admin creds → token has `role:'admin'`.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a) {
  const r = await (await a.post('/api/auth/login', { email: 'admin@test.local', password: 'AdminPass#123' })).json();
  return r.token;
}
async function makeUser(a, email) {
  await a.post('/api/auth/register', { name: 'U', email, password: 'secret12', currency: 'USD' });
  return (await (await a.post('/api/auth/login', { email, password: 'secret12' })).json()).user;
}

test('non-admin cannot list users', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'n@x.co');
    const tok = (await (await a.post('/api/auth/login', { email: 'n@x.co', password: 'secret12' })).json()).token;
    assert.equal((await a.get('/api/admin/users', tok)).status, 401);
  });
});
test('admin credits a user balance', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'k@x.co');
    const tok = await adminToken(a);
    const res = await a.post(`/api/admin/users/${u.id}/credit`, { amount: '50.00', note: 'verified' }, tok);
    assert.equal(res.status, 200);
    const users = await (await a.get('/api/admin/users', tok)).json();
    assert.equal(users.find(x => x.id === u.id).balance_minor, 5000);
  });
});
test('debit beyond balance is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'd@x.co');
    const tok = await adminToken(a);
    const res = await a.post(`/api/admin/users/${u.id}/debit`, { amount: '5.00' }, tok);
    assert.equal(res.status, 400);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `backend/routes/admin.js`**

```js
const express = require('express');
const { requireAdmin } = require('../auth');
const { toMinor } = require('../money');
const router = express.Router();
router.use(requireAdmin);

router.get('/users', (req, res) => res.json(req.app.locals.stmts.getAllUsers.all()));
router.get('/transactions', (req, res) => res.json(req.app.locals.stmts.getAllTxns.all()));

function adjust(kind) {
  return (req, res) => {
    const { stmts, helpers } = req.app.locals;
    const id = parseInt(req.params.id, 10);
    const u = stmts.getUserById.get({ id });
    if (!u) return res.status(404).json({ error: 'User not found.' });
    const amt = toMinor(req.body?.amount);
    if (!amt.ok) return res.status(400).json({ error: amt.error });
    try {
      if (kind === 'credit') helpers.creditUser(id, amt.minor, req.body?.note);
      else helpers.debitUser(id, amt.minor, req.body?.note);
    } catch (e) {
      if (e.message === 'INSUFFICIENT') return res.status(400).json({ error: 'Amount exceeds the user balance.' });
      throw e;
    }
    res.json({ ok: true });
  };
}
router.post('/users/:id/credit', adjust('credit'));
router.post('/users/:id/debit', adjust('debit'));

router.post('/users/:id/block', (req, res) => {
  const { stmts, helpers } = req.app.locals;
  const id = parseInt(req.params.id, 10);
  if (!stmts.getUserById.get({ id })) return res.status(404).json({ error: 'User not found.' });
  helpers.setBlocked(id, !!req.body?.blocked);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Step 4: Mount in `backend/server.js`:** `app.use('/api/admin', require('./routes/admin'));`
- [ ] **Step 5: Run → PASS.** Then run full suite `npm test` (all green).
- [ ] **Step 6: Commit** `git commit -am "feat: admin users list, credit/debit, block"`

---

## Phase B — Secured withdrawal + OTP

### Task B1: OTP issuance (user-bound) — db + admin routes (TDD)

**Files:** Modify `backend/db.js` (otp stmts + `issueOtp` helper), `backend/routes/admin.js` (otp routes); Test `tests/otp.test.js`

**Interfaces:**
- Produces on `stmts`: `getOtpByCode(code)`, `getAllOtps()` (join user), `deleteOtp(id)`, `markOtpUsed(id)`.
- Produces on `helpers`: `issueOtp(userId, note) -> code` (generates unique 8-char, inserts active row).
- Produces routes: `GET /api/admin/otps`; `POST /api/admin/otps` `{user_id, note}` → `{code}`; `DELETE /api/admin/otps/:id`.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }
async function makeUser(a,email){ await a.post('/api/auth/register',{name:'U',email,password:'secret12',currency:'USD'}); return (await (await a.post('/api/auth/login',{email,password:'secret12'})).json()).user; }

test('admin issues a user-bound 8-char OTP', async () => {
  await withApp(async ({ base }) => {
    const a = api(base); const u = await makeUser(a,'o@x.co'); const tok = await adminToken(a);
    const res = await a.post('/api/admin/otps', { user_id: u.id, note: 'for payout' }, tok);
    const body = await res.json();
    assert.match(body.code, /^[A-Z0-9]{8}$/);
    const list = await (await a.get('/api/admin/otps', tok)).json();
    assert.equal(list[0].user_id, u.id);
    assert.equal(list[0].status, 'active');
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add to `backend/db.js`** — inside `initDb`, add statements and helper, and an OTP generator:

```js
// add to stmts:
insertOtp: db.prepare(`INSERT INTO otps (code,user_id,note) VALUES (@code,@user_id,@note)`),
getOtpByCode: db.prepare(`SELECT * FROM otps WHERE code=@code`),
getActiveOtpForUser: db.prepare(`SELECT * FROM otps WHERE code=@code AND user_id=@user_id AND status='active'`),
markOtpUsed: db.prepare(`UPDATE otps SET status='used', used_at=datetime('now') WHERE id=@id`),
getAllOtps: db.prepare(`SELECT o.*, u.email AS user_email, u.name AS user_name FROM otps o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC`),
deleteOtp: db.prepare(`DELETE FROM otps WHERE id=@id`),
```

```js
// OTP generator (module scope, above initDb or inside it):
const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genOtp() { let c=''; for (let i=0;i<8;i++) c += OTP_ALPHABET[Math.floor(Math.random()*OTP_ALPHABET.length)]; return c; }
```

```js
// add to helpers:
issueOtp(userId, note) {
  let code, tries = 0;
  do { code = genOtp(); tries++; } while (stmts.getOtpByCode.get({ code }) && tries < 6);
  stmts.insertOtp.run({ code, user_id: userId, note: note || null });
  return code;
},
```

- [ ] **Step 4: Add OTP routes to `backend/routes/admin.js`**

```js
router.get('/otps', (req, res) => res.json(req.app.locals.stmts.getAllOtps.all()));
router.post('/otps', (req, res) => {
  const { stmts, helpers } = req.app.locals;
  const userId = parseInt(req.body?.user_id, 10);
  if (!stmts.getUserById.get({ id: userId })) return res.status(404).json({ error: 'User not found.' });
  res.json({ code: helpers.issueOtp(userId, req.body?.note), ok: true });
});
router.delete('/otps/:id', (req, res) => {
  req.app.locals.stmts.deleteOtp.run({ id: parseInt(req.params.id, 10) });
  res.json({ ok: true });
});
```

- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** `git commit -am "feat: user-bound OTP issuance (admin)"`

---

### Task B2: `createWithdrawal` atomic helper (TDD — the security crux)

**Files:** Modify `backend/db.js` (withdrawal stmts + `createWithdrawal`, `markWithdrawalPaid`, `rejectWithdrawal`); Test `tests/withdrawal.helper.test.js`

**Interfaces:**
- Produces on `helpers`:
  - `createWithdrawal(userId, { amountMinor, otpCode, bank }) -> { reference }`. `bank = { bank_name, account_name, account_number, account_type?, bank_country?, routine_bank_code? }`. Throws `Error('INVALID_OTP')`, `Error('INSUFFICIENT')`.
  - `markWithdrawalPaid(id, adminNote)`; `rejectWithdrawal(id, adminNote)` (refunds balance).
- Produces on `stmts`: `getWithdrawalById`, `getAllWithdrawals` (join user), `insertWithdrawal`, `setWithdrawalStatus`, `linkWithdrawalTxn`, `setTxnStatus`.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { initDb } = require('../backend/db');

function freshDb(){ const f=path.join(os.tmpdir(),`aftw-${Date.now()}-${Math.random().toString(16).slice(2)}.db`); return {...initDb(f), cleanup:()=>{for(const e of['','-shm','-wal']){try{fs.unlinkSync(f+e)}catch{}}}}; }
function seedUser(stmts, helpers, email, bal){ stmts.insertUser.run({name:'U',email,password:'h',currency:'NGN'}); const u=stmts.getUserByEmail.get({email}); if(bal) helpers.creditUser(u.id,bal,'seed'); return u; }
const BANK = { bank_name:'GTB', account_name:'Ada', account_number:'0123456789' };

test('valid OTP holds balance and creates pending withdrawal + txn', () => {
  const { stmts, helpers, cleanup } = freshDb();
  const u = seedUser(stmts, helpers, 'a@x.co', 10000);
  const code = helpers.issueOtp(u.id, null);
  const { reference } = helpers.createWithdrawal(u.id, { amountMinor: 4000, otpCode: code, bank: BANK });
  assert.ok(reference);
  assert.equal(stmts.getUserById.get({ id: u.id }).balance_minor, 6000); // held
  const w = stmts.getAllWithdrawals.all().find(x => x.reference === reference);
  assert.equal(w.status, 'pending');
  assert.equal(w.amount_minor, 4000);
  const txns = stmts.getTxnsByUser.all({ user_id: u.id });
  assert.ok(txns.find(t => t.type === 'withdrawal' && t.status === 'pending' && t.amount_minor === 4000));
  cleanup();
});
test('OTP is single-use', () => {
  const { stmts, helpers, cleanup } = freshDb();
  const u = seedUser(stmts, helpers, 'b@x.co', 10000);
  const code = helpers.issueOtp(u.id, null);
  helpers.createWithdrawal(u.id, { amountMinor: 1000, otpCode: code, bank: BANK });
  assert.throws(() => helpers.createWithdrawal(u.id, { amountMinor: 1000, otpCode: code, bank: BANK }), /INVALID_OTP/);
  cleanup();
});
test("a user cannot redeem another user's OTP", () => {
  const { stmts, helpers, cleanup } = freshDb();
  const a = seedUser(stmts, helpers, 'a2@x.co', 10000);
  const b = seedUser(stmts, helpers, 'b2@x.co', 10000);
  const codeForA = helpers.issueOtp(a.id, null);
  assert.throws(() => helpers.createWithdrawal(b.id, { amountMinor: 1000, otpCode: codeForA, bank: BANK }), /INVALID_OTP/);
  cleanup();
});
test('insufficient balance is rejected and OTP stays active', () => {
  const { stmts, helpers, cleanup } = freshDb();
  const u = seedUser(stmts, helpers, 'c@x.co', 500);
  const code = helpers.issueOtp(u.id, null);
  assert.throws(() => helpers.createWithdrawal(u.id, { amountMinor: 1000, otpCode: code, bank: BANK }), /INSUFFICIENT/);
  assert.equal(stmts.getActiveOtpForUser.get({ code, user_id: u.id }).status, 'active');
  cleanup();
});
test('reject refunds the held balance', () => {
  const { stmts, helpers, cleanup } = freshDb();
  const u = seedUser(stmts, helpers, 'r@x.co', 10000);
  const code = helpers.issueOtp(u.id, null);
  const { reference } = helpers.createWithdrawal(u.id, { amountMinor: 4000, otpCode: code, bank: BANK });
  const w = stmts.getAllWithdrawals.all().find(x => x.reference === reference);
  helpers.rejectWithdrawal(w.id, 'bad details');
  assert.equal(stmts.getUserById.get({ id: u.id }).balance_minor, 10000); // refunded
  cleanup();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add to `backend/db.js`** — statements:

```js
insertWithdrawal: db.prepare(`INSERT INTO withdrawals
  (reference,user_id,amount_minor,currency,beneficiary_bank_name,beneficiary_account_name,beneficiary_account_number,beneficiary_account_type,beneficiary_bank_country,routine_bank_code,otp_code)
  VALUES (@reference,@user_id,@amount_minor,@currency,@bank_name,@account_name,@account_number,@account_type,@bank_country,@routine_bank_code,@otp_code)`),
getWithdrawalById: db.prepare(`SELECT * FROM withdrawals WHERE id=@id`),
getAllWithdrawals: db.prepare(`SELECT w.*, u.name AS user_name, u.email AS user_email FROM withdrawals w JOIN users u ON u.id=w.user_id ORDER BY w.created_at DESC`),
linkWithdrawalTxn: db.prepare(`UPDATE withdrawals SET transaction_id=@txn WHERE id=@id`),
setWithdrawalStatus: db.prepare(`UPDATE withdrawals SET status=@status, admin_note=@admin_note, updated_at=datetime('now'), paid_at=CASE WHEN @status='paid' THEN datetime('now') ELSE paid_at END WHERE id=@id`),
setTxnStatus: db.prepare(`UPDATE transactions SET status=@status WHERE id=@id`),
```

helpers (use `crypto` at top of file: `const crypto = require('node:crypto');`):

```js
createWithdrawal(userId, { amountMinor, otpCode, bank }) {
  return tx(() => {
    const u = stmts.getUserByIdFull.get({ id: userId });
    if (!u) throw new Error('NO_USER');
    const code = String(otpCode || '').trim().toUpperCase();
    const otp = stmts.getActiveOtpForUser.get({ code, user_id: userId });
    if (!otp) throw new Error('INVALID_OTP');
    if (u.balance_minor < amountMinor) throw new Error('INSUFFICIENT');
    stmts.markOtpUsed.run({ id: otp.id });
    stmts.addBalance.run({ id: userId, delta: -amountMinor });
    const reference = 'AFT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const txn = stmts.insertTxn.run({ user_id: userId, type: 'withdrawal', amount_minor: amountMinor, currency: u.currency, status: 'pending', reference, note: null });
    const w = stmts.insertWithdrawal.run({
      reference, user_id: userId, amount_minor: amountMinor, currency: u.currency,
      bank_name: bank.bank_name, account_name: bank.account_name, account_number: bank.account_number,
      account_type: bank.account_type || null, bank_country: bank.bank_country || null,
      routine_bank_code: bank.routine_bank_code || null, otp_code: code,
    });
    stmts.linkWithdrawalTxn.run({ id: w.lastInsertRowid, txn: txn.lastInsertRowid });
    return { reference };
  });
},
markWithdrawalPaid(id, adminNote) {
  return tx(() => {
    const w = stmts.getWithdrawalById.get({ id });
    if (!w) throw new Error('NO_WITHDRAWAL');
    if (w.status !== 'pending') throw new Error('NOT_PENDING');
    stmts.setWithdrawalStatus.run({ id, status: 'paid', admin_note: adminNote || w.admin_note || null });
    if (w.transaction_id) stmts.setTxnStatus.run({ id: w.transaction_id, status: 'completed' });
  });
},
rejectWithdrawal(id, adminNote) {
  return tx(() => {
    const w = stmts.getWithdrawalById.get({ id });
    if (!w) throw new Error('NO_WITHDRAWAL');
    if (w.status !== 'pending') throw new Error('NOT_PENDING');
    stmts.addBalance.run({ id: w.user_id, delta: w.amount_minor }); // refund the hold
    stmts.setWithdrawalStatus.run({ id, status: 'rejected', admin_note: adminNote || w.admin_note || null });
    if (w.transaction_id) stmts.setTxnStatus.run({ id: w.transaction_id, status: 'failed' });
  });
},
```

- [ ] **Step 4: Run → PASS** (all 5 withdrawal tests).
- [ ] **Step 5: Commit** `git commit -am "feat: atomic createWithdrawal with hold + paid/reject refund"`

---

### Task B3: Withdraw route (authenticated, rate-limited) (TDD)

**Files:** Modify `backend/routes/user.js` (add `POST /withdraw`), `backend/server.js` (rate limit); Test `tests/user.withdraw.test.js`

**Interfaces:**
- Consumes: `requireUser`, `helpers.createWithdrawal`, `toMinor`.
- Produces: `POST /api/user/withdraw` `{ amount, otp, bank_name, account_name, account_number, account_type?, bank_country?, routine_bank_code? }` → `{ reference }`. Maps errors: `INVALID_OTP`→401, `INSUFFICIENT`→400.

- [ ] **Step 1: Failing tests**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }
async function userLogin(a,email){ await a.post('/api/auth/register',{name:'U',email,password:'secret12',currency:'NGN'}); return (await (await a.post('/api/auth/login',{email,password:'secret12'})).json()); }
const BANK = { bank_name:'GTB', account_name:'Ada', account_number:'0123456789' };

test('withdraw with a valid issued OTP succeeds and holds balance', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u@x.co');
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: code, ...BANK }, token);
    assert.equal(res.status, 200);
    assert.ok((await res.json()).reference);
    assert.equal((await (await a.get('/api/user/profile', token)).json()).balance_minor, 6000);
  });
});
test('withdraw without OTP is rejected', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u2@x.co');
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: 'BADCODE1', ...BANK }, token);
    assert.equal(res.status, 401);
  });
});
test('withdraw above balance is rejected', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u3@x.co');
    deps.helpers.creditUser(user.id, 1000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: code, ...BANK }, token);
    assert.equal(res.status, 400);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add to `backend/routes/user.js`**

```js
const { toMinor } = require('../money');

router.post('/withdraw', requireUser, (req, res) => {
  const { helpers } = req.app.locals;
  const b = req.body || {};
  if (!b.bank_name || !b.account_name || !b.account_number) return res.status(400).json({ error: 'Bank name, account name and account number are required.' });
  if (!b.otp) return res.status(400).json({ error: 'A confirmation code is required.' });
  const amt = toMinor(b.amount);
  if (!amt.ok) return res.status(400).json({ error: amt.error });
  try {
    const out = helpers.createWithdrawal(req.user.id, {
      amountMinor: amt.minor, otpCode: b.otp,
      bank: { bank_name: String(b.bank_name).trim(), account_name: String(b.account_name).trim(), account_number: String(b.account_number).trim(), account_type: b.account_type, bank_country: b.bank_country, routine_bank_code: b.routine_bank_code },
    });
    res.json({ ok: true, reference: out.reference });
  } catch (e) {
    if (e.message === 'INVALID_OTP') return res.status(401).json({ error: 'Invalid or already-used confirmation code. Ask the admin for a new one.' });
    if (e.message === 'INSUFFICIENT') return res.status(400).json({ error: 'Amount exceeds your available balance.' });
    throw e;
  }
});
```

- [ ] **Step 4: Add rate limit in `backend/server.js`** (before mounting `/api/user`):

```js
app.use('/api/user/withdraw', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
```

- [ ] **Step 5: Run → PASS.**
- [ ] **Step 6: Commit** `git commit -am "feat: authenticated OTP-gated withdraw endpoint"`

---

### Task B4: Admin withdrawal resolution routes (TDD)

**Files:** Modify `backend/routes/admin.js`; Test `tests/admin.withdrawals.test.js`

**Interfaces:**
- Produces: `GET /api/admin/withdrawals`; `POST /api/admin/withdrawals/:id/paid` `{admin_note?}`; `POST /api/admin/withdrawals/:id/reject` `{admin_note?}`.

- [ ] **Step 1: Failing test**

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');
async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }

test('admin lists, then rejects a withdrawal and balance is refunded', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name:'U', email:'w@x.co', password:'secret12', currency:'NGN' });
    const { token, user } = await (await a.post('/api/auth/login', { email:'w@x.co', password:'secret12' })).json();
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    await a.post('/api/user/withdraw', { amount:'40.00', otp: code, bank_name:'GTB', account_name:'Ada', account_number:'0123456789' }, token);
    const list = await (await a.get('/api/admin/withdrawals', atok)).json();
    assert.equal(list.length, 1);
    const rej = await a.post(`/api/admin/withdrawals/${list[0].id}/reject`, { admin_note:'bad' }, atok);
    assert.equal(rej.status, 200);
    assert.equal((await (await a.get('/api/user/profile', token)).json()).balance_minor, 10000);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add to `backend/routes/admin.js`**

```js
router.get('/withdrawals', (req, res) => res.json(req.app.locals.stmts.getAllWithdrawals.all()));
function resolve(kind) {
  return (req, res) => {
    const { helpers } = req.app.locals;
    const id = parseInt(req.params.id, 10);
    try {
      if (kind === 'paid') helpers.markWithdrawalPaid(id, req.body?.admin_note);
      else helpers.rejectWithdrawal(id, req.body?.admin_note);
    } catch (e) {
      if (e.message === 'NO_WITHDRAWAL') return res.status(404).json({ error: 'Request not found.' });
      if (e.message === 'NOT_PENDING') return res.status(409).json({ error: 'Request is already resolved.' });
      throw e;
    }
    res.json({ ok: true });
  };
}
router.post('/withdrawals/:id/paid', resolve('paid'));
router.post('/withdrawals/:id/reject', resolve('reject'));
```

- [ ] **Step 4: Run → PASS.** Then `npm test` (entire suite green).
- [ ] **Step 5: Commit** `git commit -am "feat: admin withdrawal paid/reject endpoints"`

---

## Phase C — Frontend pages + i18n

> Frontend tasks keep AfriTrust b's design. **Invoke the `frontend-design` skill before writing any frontend code** (per repo CLAUDE.md), then build to match AfriTrust b and verify with the screenshot workflow. Each task lists the **behavioral contract** (element IDs, `data-i18n` keys, API calls) the JS depends on, plus complete JS. Start the API (`node backend/server.js`) and web server (`node serve.mjs`) before screenshotting.

### Task C1: i18n layer (Spanish default + toggle)

**Files:** Create `js/i18n.js`; Modify `index.html` (add toggle + `data-i18n`); Reference: `../anthony neo site/js/i18n.js`

**Contract:**
- `js/i18n.js` (IIFE) ported from the neo site, with `LANG_KEY = 'afritrust_lang'`, default `'es'`. Functions `getLang/setLang/t/applyLang`; applies to `[data-i18n]`, `[data-i18n-html]`, `[data-i18n-placeholder]`; updates `#langToggle` label (`English` when es, `Español` when en); sets `document.documentElement.lang`. Exposes `window.afriI18n`.
- Every page includes `<script src="js/i18n.js"></script>` and a nav button `<button id="langToggle" class="btn btn-ghost btn-sm">English</button>`.
- The `T` dictionary holds an `{ es, en }` entry for every visible string used across pages (built up as pages are added in C2–C6).

- [ ] **Step 1:** Copy `../anthony neo site/js/i18n.js` to `js/i18n.js`. Rename `LANG_KEY` to `'afritrust_lang'`, `window.predxI18n` → `window.afriI18n`, event name `predx:langchange` → `afri:langchange`. Replace the `T` dictionary with AfriTrust keys (start with nav + landing): `nav-how`, `nav-why`, `nav-faq`, `nav-login`, `nav-register`, `nav-withdraw`, `hero-eyebrow`, `hero-title` (i18n-html), `hero-sub`, … (author es + en for each visible string on `index.html`).
- [ ] **Step 2:** In `index.html`: add `<script src="js/i18n.js"></script>` before `</body>`; add the `#langToggle` button to `.nav-links` and footer-adjacent nav; add `data-i18n` / `data-i18n-html` / `data-i18n-placeholder` attributes to every visible string. Add nav links **Login** (`login.html`) and **Register** (`register.html`).
- [ ] **Step 3:** Start servers, screenshot, verify Spanish renders by default and toggling persists across reload.

```bash
node backend/server.js &   # API :3002 (ensure .env has JWT_SECRET)
node serve.mjs &           # web :3000
node screenshot.mjs http://localhost:3000 c1-landing-es
```
Read `temporary screenshots/screenshot-N-c1-landing-es.png`; confirm Spanish copy + toggle. Toggle to English in-browser, reload, confirm it stays English (localStorage).

- [ ] **Step 4: Commit** `git commit -am "feat: i18n layer (Spanish default) + landing toggle"`

---

### Task C2: Register & Login pages

**Files:** Create `register.html`, `login.html`, `js/auth.js`; Modify `js/config.js` (API base)

**Contract:**
- `js/config.js` exposes `window.API_BASE` (dev `http://localhost:3002`).
- `register.html` form `#registerForm` with inputs `#name`, `#email`, `#password`, and `<select id="currency">` populated from the allowlist (`NGN,USD,EUR,GBP,GHS,KES,ZAR`). Error box `#authError`.
- `login.html` form `#loginForm` with `#email`, `#password`, error `#authError`.
- `js/auth.js`:
  - register → `POST {API_BASE}/api/auth/register`; on 201 redirect to `login.html?registered=1`.
  - login → `POST {API_BASE}/api/auth/login`; on 200 store `localStorage['afritrust_token']` + `afritrust_user`, redirect: admin → `admin.html`, user → `dashboard.html`.
- Both pages use AfriTrust b styling (`css/style.css`, `css/components.css`), include `js/i18n.js` + `#langToggle`, and full `data-i18n` coverage (add the new keys to `T`).

- [ ] **Step 1:** Invoke `frontend-design`; build `register.html` + `login.html` matching AfriTrust b's panel/field/button components (reuse `withdraw.html` markup patterns: `.panel`, `.field`, `.input`, `.btn-primary`).
- [ ] **Step 2:** Write `js/auth.js`:

```js
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
```

- [ ] **Step 3:** Ensure `js/config.js` sets `window.API_BASE = location.port === '3000' ? 'http://localhost:3002' : '';`
- [ ] **Step 4:** Screenshot both pages (`node screenshot.mjs http://localhost:3000/register.html c2-register`, `.../login.html c2-login`); compare to AfriTrust b design; do ≥2 comparison rounds; fix mismatches.
- [ ] **Step 5:** Manual: register a user, confirm redirect to login, then login → dashboard placeholder.
- [ ] **Step 6: Commit** `git commit -am "feat: register and login pages wired to API"`

---

### Task C3: User dashboard (Overview + Profile)

**Files:** Create `dashboard.html`, `js/dashboard.js`

**Contract:**
- Guard: if no `afritrust_token`, redirect to `login.html`.
- Elements: `#balanceAmount`, `#balanceCurrency`, `#txnTableBody`, withdraw button `#goWithdraw` → `withdraw.html`, change-password form `#passwordForm` (`#currentPassword`, `#newPassword`), logout `#logoutBtn`, error/success `#dashMsg`.
- Loads `GET /api/user/profile` and `GET /api/user/transactions` with `Authorization: Bearer`. Formats money with a JS port of `formatMoney` (use `Intl.NumberFormat`).
- AfriTrust b styling; i18n + `#langToggle`.

- [ ] **Step 1:** Invoke `frontend-design`; build `dashboard.html` (balance card reusing AfriTrust b's `.balance-card`/hero-visual styling; a transactions table; a profile/change-password `.panel`).
- [ ] **Step 2:** Write `js/dashboard.js`:

```js
(function () {
  const API = window.API_BASE || '';
  const token = localStorage.getItem('afritrust_token');
  if (!token) { location.href = 'login.html'; return; }
  const $ = (id) => document.getElementById(id);
  const auth = { 'Authorization': 'Bearer ' + token };
  const fmt = (minor, cur) => { try { return new Intl.NumberFormat('en',{style:'currency',currency:cur,currencyDisplay:'narrowSymbol'}).format(minor/100); } catch { return (minor/100).toFixed(2)+' '+cur; } };

  async function load() {
    const pr = await fetch(API + '/api/user/profile', { headers: auth });
    if (pr.status === 401) { localStorage.clear(); location.href = 'login.html'; return; }
    const u = await pr.json();
    $('balanceAmount').textContent = fmt(u.balance_minor, u.currency);
    if ($('balanceCurrency')) $('balanceCurrency').textContent = u.currency;
    const txns = await (await fetch(API + '/api/user/transactions', { headers: auth })).json();
    $('txnTableBody').innerHTML = txns.length ? txns.map(t =>
      `<tr><td>${t.type}</td><td>${fmt(t.amount_minor, t.currency)}</td><td>${t.status}</td><td>${t.created_at}</td></tr>`
    ).join('') : `<tr><td colspan="4">No transactions yet.</td></tr>`;
  }

  const pf = $('passwordForm');
  if (pf) pf.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const r = await fetch(API + '/api/user/password', { method:'POST', headers:{'Content-Type':'application/json',...auth}, body: JSON.stringify({ current: $('currentPassword').value, next: $('newPassword').value }) });
    const d = await r.json();
    $('dashMsg').textContent = r.ok ? 'Password updated.' : (d.error || 'Could not update.');
  });

  const lg = $('logoutBtn');
  if (lg) lg.addEventListener('click', () => { localStorage.clear(); location.href = 'index.html'; });
  const gw = $('goWithdraw');
  if (gw) gw.addEventListener('click', () => { location.href = 'withdraw.html'; });
  load();
})();
```

- [ ] **Step 3:** Screenshot, compare to AfriTrust b, ≥2 rounds. Verify balance shows after an admin credit (seed via admin UI in C5 or `curl`).
- [ ] **Step 4: Commit** `git commit -am "feat: user dashboard (balance, transactions, password)"`

---

### Task C4: Withdraw page — authenticated + balance-aware

**Files:** Modify `withdraw.html`, `js/withdraw.js`

**Contract:**
- Guard: require `afritrust_token` else redirect to `login.html`.
- Prefill: load profile; lock the currency `#currency` to the user's currency; show available balance; the existing 2-step flow (details → OTP) is preserved.
- Submit posts `POST /api/user/withdraw` with `Authorization` header and fields `{ amount, otp, bank_name, account_name, account_number, account_type, bank_country, routine_bank_code }`. On success → `success.html?ref=...`.
- Keep AfriTrust b's existing `withdraw.html` markup/stepper; only adjust currency handling + the submit call.

- [ ] **Step 1:** Read the existing `js/withdraw.js` (copied from AfriTrust b) and update: add the token guard; fetch `/api/user/profile` to set currency + show balance; change the submit endpoint from `/api/withdraw` to `/api/user/withdraw`; add the `Authorization` header; map field names to the contract above; redirect to `success.html?ref=${reference}`.
- [ ] **Step 2:** In `withdraw.html`, ensure the currency `<select id="currency">` is disabled/locked and set from profile; show an available-balance line; add i18n attributes; include `js/i18n.js`.
- [ ] **Step 3:** Screenshot (`c4-withdraw`), compare to AfriTrust b's `withdraw.html`, ≥2 rounds.
- [ ] **Step 4:** Manual end-to-end: credit a user (admin), issue an OTP, complete a withdrawal, confirm balance held + success page shows reference.
- [ ] **Step 5: Commit** `git commit -am "feat: authenticated balance-aware withdraw flow"`

---

### Task C5: Admin dashboard

**Files:** Modify `admin.html`; Create/replace `js/admin.js`

**Contract:**
- Login panel `#adminLoginForm` (`#adminEmail`, `#adminPassword`) → `POST /api/auth/login`; store token; require `role==='admin'` (else show error). Persist `afritrust_admin_token`.
- Views (tabs/sections): **Users** (`#usersTableBody`) with per-row actions: **Credit** (`#creditModal`: amount+note → `/api/admin/users/:id/credit`), **Debit** (`/debit`), **Block/Unblock** (`/block`), **Issue OTP** (`/api/admin/otps {user_id,note}` → show code to copy). **Withdrawals** (`#withdrawalsTableBody`) with **Mark paid** / **Reject**. **Transactions** (`#txnsTableBody`).
- All admin fetches send `Authorization: Bearer <admin token>`; on 401 clear + show login.
- AfriTrust b styling; i18n optional for admin (internal tool) but include `#langToggle` for consistency.

- [ ] **Step 1:** Invoke `frontend-design`; build `admin.html` with a login panel + the four sections using AfriTrust b table/panel/button components. Reuse the existing AfriTrust b `admin.html` OTP/withdrawals layout where present; add the Users section + credit/debit/issue-OTP controls.
- [ ] **Step 2:** Write `js/admin.js` covering: login; `loadUsers()`, `loadWithdrawals()`, `loadTransactions()`; action handlers (credit, debit, block toggle, issue OTP showing the returned `code`, mark paid, reject). Amounts entered in major units; backend converts. Example credit handler:

```js
async function credit(userId) {
  const amount = prompt('Amount to credit (major units):'); if (!amount) return;
  const note = prompt('Note (optional):') || '';
  const r = await fetch(API + `/api/admin/users/${userId}/credit`, { method:'POST', headers:{'Content-Type':'application/json',...adminAuth()}, body: JSON.stringify({ amount, note }) });
  const d = await r.json(); alert(r.ok ? 'Credited.' : (d.error||'Failed')); loadUsers();
}
async function issueOtp(userId) {
  const note = prompt('OTP note (optional):') || '';
  const r = await fetch(API + '/api/admin/otps', { method:'POST', headers:{'Content-Type':'application/json',...adminAuth()}, body: JSON.stringify({ user_id: userId, note }) });
  const d = await r.json(); if (r.ok) alert('OTP for user: ' + d.code + '\nRelay this to the user.'); else alert(d.error||'Failed');
}
```
(Build the full file with `adminAuth()` returning the Bearer header from `afritrust_admin_token`, plus table renderers and the login form handler. The prompts above are acceptable for an internal admin tool; a modal is optional polish.)

- [ ] **Step 3:** Screenshot (`c5-admin`), compare to AfriTrust b admin design, ≥2 rounds.
- [ ] **Step 4:** Manual full loop: admin logs in → sees a registered user → credits them → issues an OTP → (user withdraws) → admin sees pending withdrawal → marks paid; and a second one → reject → user refunded.
- [ ] **Step 5: Commit** `git commit -am "feat: admin dashboard (users, credit/debit, OTP, withdrawals)"`

---

### Task C6: Landing polish, i18n completeness, success page, final QA

**Files:** Modify `index.html`, `success.html`; touch `js/i18n.js` (fill remaining keys)

- [ ] **Step 1:** Update `index.html` FAQ/copy that says "no account needed" to reflect the account model (keep AfriTrust b visual style). Ensure nav has Login/Register/withdraw + `#langToggle`.
- [ ] **Step 2:** `success.html`: read `?ref=` and display the reference; add i18n; include toggle.
- [ ] **Step 3:** Verify the full `T` dictionary has `es` + `en` for every visible string across all pages; toggle each page to English and screenshot to confirm no untranslated keys.
- [ ] **Step 4:** Run `npm test` (all green). Screenshot every page in both languages (`c6-*-es`, `c6-*-en`); final comparison vs AfriTrust b.
- [ ] **Step 5:** Manual security pass: confirm dashboard/withdraw redirect to login without a token; confirm a user cannot redeem another user's OTP (issue for A, try as B); confirm withdraw > balance fails.
- [ ] **Step 6: Commit** `git commit -am "feat: landing copy, success page, full bilingual coverage"`

---

## Self-review (spec coverage)

- Accounts + currency at registration → A6, C2. Login/JWT → A5/A6. Profile/balance/transactions → A4/A7/C3.
- Admin credits balance (server-side, atomic, ledger) → A4/A8/C5.
- OTP user-bound, single-use, admin-issued → B1; withdraw hold + atomicity + cross-user rejection → B2/B3; admin paid/reject+refund → B2/B4/C5.
- Integer minor units everywhere → A2 + all money paths. Security (bcrypt, JWT, rate limit, helmet, whitelist, parameterized SQL, no-boot-without-secret) → A1/A4/A5/A6/B3.
- Spanish default + toggle (predx pattern) → C1, applied across C2–C6.
- AfriTrust b visual design preserved → all Phase C tasks via frontend-design + screenshot rounds.
- Acceptance criteria §12 → exercised by C6 Step 5 manual pass + the Phase A/B test suites.

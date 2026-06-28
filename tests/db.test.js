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

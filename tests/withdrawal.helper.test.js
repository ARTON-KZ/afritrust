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

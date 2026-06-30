const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const OTP_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genOtp() {
  let c = '';
  for (let i = 0; i < 8; i++) c += OTP_ALPHABET[crypto.randomInt(OTP_ALPHABET.length)];
  return c;
}

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
    insertOtp: db.prepare(`INSERT INTO otps (code,user_id,note) VALUES (@code,@user_id,@note)`),
    getOtpByCode: db.prepare(`SELECT * FROM otps WHERE code=@code`),
    getActiveOtpForUser: db.prepare(`SELECT * FROM otps WHERE code=@code AND user_id=@user_id AND status='active'`),
    markOtpUsed: db.prepare(`UPDATE otps SET status='used', used_at=datetime('now') WHERE id=@id`),
    getAllOtps: db.prepare(`SELECT o.*, u.email AS user_email, u.name AS user_name FROM otps o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC`),
    deleteOtp: db.prepare(`DELETE FROM otps WHERE id=@id`),
    insertWithdrawal: db.prepare(`INSERT INTO withdrawals
  (reference,user_id,amount_minor,currency,beneficiary_bank_name,beneficiary_account_name,beneficiary_account_number,beneficiary_account_type,beneficiary_bank_country,routine_bank_code,otp_code,status)
  VALUES (@reference,@user_id,@amount_minor,@currency,@bank_name,@account_name,@account_number,@account_type,@bank_country,@routine_bank_code,@otp_code,'awaiting_approval')`),
    getWithdrawalById: db.prepare(`SELECT * FROM withdrawals WHERE id=@id`),
    getAllWithdrawals: db.prepare(`SELECT w.*, u.name AS user_name, u.email AS user_email FROM withdrawals w JOIN users u ON u.id=w.user_id ORDER BY w.created_at DESC`),
    linkWithdrawalTxn: db.prepare(`UPDATE withdrawals SET transaction_id=@txn WHERE id=@id`),
    setWithdrawalStatus: db.prepare(`UPDATE withdrawals SET status=@status, admin_note=@admin_note, updated_at=datetime('now'), paid_at=CASE WHEN @status='paid' THEN datetime('now') ELSE paid_at END WHERE id=@id`),
    setTxnStatus: db.prepare(`UPDATE transactions SET status=@status WHERE id=@id`),
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
    issueOtp(userId, note) {
      let code, tries = 0;
      do { code = genOtp(); tries++; } while (stmts.getOtpByCode.get({ code }) && tries < 8);
      if (stmts.getOtpByCode.get({ code })) throw new Error('OTP_GEN_FAILED');
      stmts.insertOtp.run({ code, user_id: userId, note: note || null });
      return code;
    },
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
        const txn = stmts.insertTxn.run({ user_id: userId, type: 'withdrawal', amount_minor: amountMinor, currency: u.currency, status: 'awaiting_approval', reference, note: null });
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
    // Admin's first acknowledgement: the user is allowed to request this
    // withdrawal. Moves it from 'awaiting_approval' to 'pending' payout.
    acknowledgeWithdrawal(id, adminNote) {
      return tx(() => {
        const w = stmts.getWithdrawalById.get({ id });
        if (!w) throw new Error('NO_WITHDRAWAL');
        if (w.status !== 'awaiting_approval') throw new Error('NOT_AWAITING');
        stmts.setWithdrawalStatus.run({ id, status: 'pending', admin_note: adminNote || w.admin_note || null });
        if (w.transaction_id) stmts.setTxnStatus.run({ id: w.transaction_id, status: 'pending' });
      });
    },
    markWithdrawalPaid(id, adminNote) {
      return tx(() => {
        const w = stmts.getWithdrawalById.get({ id });
        if (!w) throw new Error('NO_WITHDRAWAL');
        if (w.status !== 'pending') throw new Error('NOT_PENDING'); // must be acknowledged first
        stmts.setWithdrawalStatus.run({ id, status: 'paid', admin_note: adminNote || w.admin_note || null });
        if (w.transaction_id) stmts.setTxnStatus.run({ id: w.transaction_id, status: 'completed' });
      });
    },
    rejectWithdrawal(id, adminNote) {
      return tx(() => {
        const w = stmts.getWithdrawalById.get({ id });
        if (!w) throw new Error('NO_WITHDRAWAL');
        if (w.status === 'paid' || w.status === 'rejected') throw new Error('NOT_PENDING'); // already resolved
        stmts.addBalance.run({ id: w.user_id, delta: w.amount_minor }); // refund the hold
        stmts.setWithdrawalStatus.run({ id, status: 'rejected', admin_note: adminNote || w.admin_note || null });
        if (w.transaction_id) stmts.setTxnStatus.run({ id: w.transaction_id, status: 'failed' });
      });
    },
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

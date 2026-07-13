const express = require('express');
const bcrypt = require('bcryptjs');
const { requireUser } = require('../auth');
const { toMinor } = require('../money');
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

router.post('/withdraw', requireUser, (req, res) => {
  const { helpers } = req.app.locals;
  const b = req.body || {};
  if (!b.bank_name || !b.account_name || !b.account_number) return res.status(400).json({ error: 'Bank name, account name and account number are required.' });
  if (!b.otp) return res.status(400).json({ error: 'A withdrawal code is required.' });
  const amt = toMinor(b.amount);
  if (!amt.ok) return res.status(400).json({ error: amt.error });
  try {
    const out = helpers.createWithdrawal(req.user.id, {
      amountMinor: amt.minor, otpCode: b.otp,
      bank: { bank_name: String(b.bank_name).trim(), account_name: String(b.account_name).trim(), account_number: String(b.account_number).trim(), account_type: b.account_type, bank_country: b.bank_country, routine_bank_code: b.routine_bank_code },
    });
    res.json({ ok: true, reference: out.reference });
  } catch (e) {
    if (e.message === 'INVALID_OTP') return res.status(401).json({ error: 'Invalid or already-used withdrawal code. Ask the admin for a new one.' });
    if (e.message === 'INSUFFICIENT') return res.status(400).json({ error: 'Amount exceeds your available balance.' });
    throw e;
  }
});

module.exports = router;

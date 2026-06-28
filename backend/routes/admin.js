const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { stmts } = require('../db');

function verifyAdminToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('Not admin');
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}

function generateCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// === Confirmation codes (single-use) ===

router.get('/otps', verifyAdminToken, (req, res) => {
  try {
    res.json({ otps: stmts.getAllOtps.all() });
  } catch (err) {
    console.error('Get OTPs error:', err.message);
    res.status(500).json({ error: 'Failed to load codes.' });
  }
});

router.post('/otps', verifyAdminToken, (req, res) => {
  try {
    const note = (req.body?.note || '').trim() || null;
    let code, attempts = 0;
    do {
      code = generateCode(8);
      attempts++;
    } while (stmts.getActiveOtpByCode.get({ code }) && attempts < 5);
    stmts.insertOtp.run({ code, note });
    res.json({ code, success: true });
  } catch (err) {
    console.error('Generate OTP error:', err.message);
    res.status(500).json({ error: 'Failed to generate code.' });
  }
});

router.delete('/otps/:id', verifyAdminToken, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID.' });
    stmts.deleteOtp.run(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete OTP error:', err.message);
    res.status(500).json({ error: 'Failed to delete code.' });
  }
});

// === Withdrawal requests ===

router.get('/withdrawals', verifyAdminToken, (req, res) => {
  try {
    res.json({ withdrawals: stmts.getAllWithdrawals.all() });
  } catch (err) {
    console.error('Get withdrawals error:', err.message);
    res.status(500).json({ error: 'Failed to load requests.' });
  }
});

router.post('/withdrawals/:id/paid', verifyAdminToken, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const w = stmts.getWithdrawalById.get(id);
    if (!w) return res.status(404).json({ error: 'Request not found.' });
    stmts.updateWithdrawalStatus.run({
      id, status: 'paid', admin_note: (req.body?.admin_note || '').trim() || w.admin_note || null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Mark paid error:', err.message);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

router.post('/withdrawals/:id/reject', verifyAdminToken, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const w = stmts.getWithdrawalById.get(id);
    if (!w) return res.status(404).json({ error: 'Request not found.' });
    stmts.updateWithdrawalStatus.run({
      id, status: 'rejected', admin_note: (req.body?.admin_note || '').trim() || w.admin_note || null,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Reject withdrawal error:', err.message);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

module.exports = router;

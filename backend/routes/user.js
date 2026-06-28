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

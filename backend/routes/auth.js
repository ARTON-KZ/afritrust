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

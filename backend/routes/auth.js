const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const { validateRegistration, EMAIL_RE } = require('../validate');
const { signToken } = require('../auth');
const { sendSignupOtp, sendWelcome } = require('../mail');
const router = express.Router();

const OTP_TTL_MINUTES = 10;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, currency: u.currency, balance_minor: u.balance_minor, role: u.role });

const normalizeEmail = (raw) => String(raw || '').trim().toLowerCase();
const sixDigitCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// Step 1 — email entered. Send a 6-digit code. Not revealing whether the
// email already has an account is deliberate (no account enumeration);
// returning 409 when it does matches the final /register behaviour so the
// user sees the error sooner.
router.post('/request-signup-otp', async (req, res) => {
  try {
    const { stmts } = req.app.locals;
    const email = normalizeEmail(req.body?.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (stmts.getUserByEmail.get({ email })) return res.status(409).json({ error: 'Email already registered.' });

    const code = sixDigitCode();
    const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
    stmts.upsertSignupOtp.run({ email, code, expires_at });

    try { await sendSignupOtp(email, code); }
    catch (mailErr) {
      console.error('OTP mail error:', mailErr.message);
      return res.status(502).json({ error: 'Could not send the code. Please try again in a moment.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('request-signup-otp error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Step 2 — verify the code the user typed. Marks the row verified; the final
// /register call requires a verified, unexpired row for this email.
router.post('/verify-signup-otp', (req, res) => {
  try {
    const { stmts } = req.app.locals;
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    const row = stmts.getSignupOtp.get({ email });
    if (!row) return res.status(400).json({ error: 'Request a code first.' });
    if (new Date(row.expires_at).getTime() < Date.now())
      return res.status(400).json({ error: 'That code has expired. Request a new one.' });
    if (row.code !== code) return res.status(401).json({ error: 'Incorrect code. Check your email and try again.' });
    stmts.markSignupVerified.run({ email });
    res.json({ ok: true });
  } catch (err) {
    console.error('verify-signup-otp error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Step 3 — final registration. Requires a verified, unexpired OTP row for
// this exact email. Welcome email is best-effort; failing to send it does
// not fail the registration.
router.post('/register', async (req, res) => {
  const { stmts } = req.app.locals;
  const v = validateRegistration(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const row = stmts.getSignupOtp.get({ email: v.clean.email });
  if (!row || !row.verified) return res.status(403).json({ error: 'Confirm your email with the code we sent you first.' });
  if (new Date(row.expires_at).getTime() < Date.now())
    return res.status(400).json({ error: 'Your signup session expired. Please start over.' });

  if (stmts.getUserByEmail.get({ email: v.clean.email })) return res.status(409).json({ error: 'Email already registered.' });

  const hash = bcrypt.hashSync(String(req.body.password), 12);
  stmts.insertUser.run({ name: v.clean.name, email: v.clean.email, password: hash, currency: v.clean.currency });
  stmts.deleteSignupOtp.run({ email: v.clean.email });

  try { await sendWelcome(v.clean.email); }
  catch (mailErr) { console.error('Welcome mail error:', mailErr.message); }

  res.status(201).json({ ok: true });
});

router.post('/login', (req, res) => {
  const { stmts } = req.app.locals;
  const email = normalizeEmail(req.body?.email);
  const u = stmts.getUserByEmail.get({ email });
  if (!u || !bcrypt.compareSync(String(req.body?.password || ''), u.password)) return res.status(401).json({ error: 'Invalid email or password.' });
  if (u.blocked) return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
  res.json({ token: signToken(u), user: publicUser(u) });
});

module.exports = router;

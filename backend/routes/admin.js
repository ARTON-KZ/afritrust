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

module.exports = router;

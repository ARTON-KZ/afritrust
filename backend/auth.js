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
  const u = req.app?.locals?.stmts?.getUserById?.get({ id: p.id });
  if (u && u.blocked) return res.status(403).json({ error: 'Your account has been suspended.' });
  req.user = { id: p.id, role: p.role };
  next();
}
function requireAdmin(req, res, next) {
  const p = decode(req);
  if (!p) return res.status(401).json({ error: 'Authentication required.' });
  if (p.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  req.user = { id: p.id, role: p.role };
  next();
}
module.exports = { signToken, requireUser, requireAdmin };

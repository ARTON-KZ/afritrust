const { test } = require('node:test');
const assert = require('node:assert');
process.env.JWT_SECRET = 'test-secret';
const { signToken, requireUser, requireAdmin } = require('../backend/auth');

function run(mw, req) {
  return new Promise((resolve) => {
    const res = { status(c){ this.code=c; return this; }, json(b){ resolve({ code:this.code, body:b }); } };
    mw(req, res, () => resolve({ next: true, req }));
  });
}

test('requireUser accepts a valid token', async () => {
  const token = signToken({ id: 7, role: 'user' });
  const out = await run(requireUser, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(out.next, true);
  assert.equal(out.req.user.id, 7);
});
test('requireAdmin rejects non-admin with 403', async () => {
  const token = signToken({ id: 7, role: 'user' });
  const out = await run(requireAdmin, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(out.code, 403);
});
test('requireAdmin rejects missing token with 401', async () => {
  const out = await run(requireAdmin, { headers: {} });
  assert.equal(out.code, 401);
});
test('requireUser rejects missing token', async () => {
  const out = await run(requireUser, { headers: {} });
  assert.equal(out.code, 401);
});

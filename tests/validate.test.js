const { test } = require('node:test');
const assert = require('node:assert');
const v = require('../backend/validate');

test('valid registration normalizes fields', () => {
  const r = v.validateRegistration({ name: ' Ada ', email: 'A@B.CO', password: 'secret12', currency: 'ngn' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.clean, { name: 'Ada', email: 'a@b.co', currency: 'NGN' });
});
test('rejects bad inputs', () => {
  assert.equal(v.validateRegistration({ name: 'A', email: 'a@b.co', password: 'secret12', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'bad', password: 'secret12', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'short', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'nodigitshere', currency: 'NGN' }).ok, false);
  assert.equal(v.validateRegistration({ name: 'Ada', email: 'a@b.co', password: 'secret12', currency: 'ZZZ' }).ok, false);
});

const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

test('register then login returns a token and safe user', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const reg = await a.post('/api/auth/register', { name: 'Ada', email: 'ada@x.co', password: 'secret12', currency: 'NGN' });
    assert.equal(reg.status, 201);
    const login = await a.post('/api/auth/login', { email: 'ada@x.co', password: 'secret12' });
    assert.equal(login.status, 200);
    const body = await login.json();
    assert.ok(body.token);
    assert.equal(body.user.email, 'ada@x.co');
    assert.equal(body.user.currency, 'NGN');
    assert.equal(body.user.password, undefined);
  });
});
test('duplicate email is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name: 'Ada', email: 'd@x.co', password: 'secret12', currency: 'USD' });
    const dup = await a.post('/api/auth/register', { name: 'Ada2', email: 'd@x.co', password: 'secret12', currency: 'USD' });
    assert.equal(dup.status, 409);
  });
});
test('wrong password is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name: 'Ada', email: 'w@x.co', password: 'secret12', currency: 'USD' });
    const bad = await a.post('/api/auth/login', { email: 'w@x.co', password: 'wrongpass9' });
    assert.equal(bad.status, 401);
  });
});

const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function registerLogin(a, email) {
  await a.post('/api/auth/register', { name: 'Ada', email, password: 'secret12', currency: 'NGN' });
  const r = await (await a.post('/api/auth/login', { email, password: 'secret12' })).json();
  return r;
}

test('profile requires auth', async () => {
  await withApp(async ({ base }) => {
    const res = await api(base).get('/api/user/profile');
    assert.equal(res.status, 401);
  });
});
test('profile returns balance and currency', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await registerLogin(a, 'p@x.co');
    deps.helpers.creditUser(user.id, 7500, 'seed');
    const res = await a.get('/api/user/profile', token);
    const body = await res.json();
    assert.equal(body.balance_minor, 7500);
    assert.equal(body.currency, 'NGN');
  });
});
test('change password works and old password fails afterward', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const { token } = await registerLogin(a, 'c@x.co');
    const ok = await a.post('/api/user/password', { current: 'secret12', next: 'newpass34' }, token);
    assert.equal(ok.status, 200);
    const oldLogin = await a.post('/api/auth/login', { email: 'c@x.co', password: 'secret12' });
    assert.equal(oldLogin.status, 401);
    const newLogin = await a.post('/api/auth/login', { email: 'c@x.co', password: 'newpass34' });
    assert.equal(newLogin.status, 200);
  });
});

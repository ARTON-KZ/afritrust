const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a) {
  const r = await (await a.post('/api/auth/login', { email: 'admin@test.local', password: 'AdminPass#123' })).json();
  return r.token;
}
async function makeUser(a, email) {
  await a.post('/api/auth/register', { name: 'User', email, password: 'secret12', currency: 'USD' });
  return (await (await a.post('/api/auth/login', { email, password: 'secret12' })).json()).user;
}

test('non-admin cannot list users', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'n@x.co');
    const tok = (await (await a.post('/api/auth/login', { email: 'n@x.co', password: 'secret12' })).json()).token;
    assert.equal((await a.get('/api/admin/users', tok)).status, 401);
  });
});
test('admin credits a user balance', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'k@x.co');
    const tok = await adminToken(a);
    const res = await a.post(`/api/admin/users/${u.id}/credit`, { amount: '50.00', note: 'verified' }, tok);
    assert.equal(res.status, 200);
    const users = await (await a.get('/api/admin/users', tok)).json();
    assert.equal(users.find(x => x.id === u.id).balance_minor, 5000);
  });
});
test('debit beyond balance is rejected', async () => {
  await withApp(async ({ base }) => {
    const a = api(base);
    const u = await makeUser(a, 'd@x.co');
    const tok = await adminToken(a);
    const res = await a.post(`/api/admin/users/${u.id}/debit`, { amount: '5.00' }, tok);
    assert.equal(res.status, 400);
  });
});

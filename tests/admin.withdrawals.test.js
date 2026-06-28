const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');
async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }

test('admin lists, then rejects a withdrawal and balance is refunded', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    await a.post('/api/auth/register', { name:'User', email:'w@x.co', password:'secret12', currency:'NGN' });
    const { token, user } = await (await a.post('/api/auth/login', { email:'w@x.co', password:'secret12' })).json();
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    await a.post('/api/user/withdraw', { amount:'40.00', otp: code, bank_name:'GTB', account_name:'Ada', account_number:'0123456789' }, token);
    const list = await (await a.get('/api/admin/withdrawals', atok)).json();
    assert.equal(list.length, 1);
    const rej = await a.post(`/api/admin/withdrawals/${list[0].id}/reject`, { admin_note:'bad' }, atok);
    assert.equal(rej.status, 200);
    assert.equal((await (await a.get('/api/user/profile', token)).json()).balance_minor, 10000);
  });
});

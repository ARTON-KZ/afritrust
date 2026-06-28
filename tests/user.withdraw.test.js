const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }
async function userLogin(a,email){ await a.post('/api/auth/register',{name:'User',email,password:'secret12',currency:'NGN'}); return (await (await a.post('/api/auth/login',{email,password:'secret12'})).json()); }
const BANK = { bank_name:'GTB', account_name:'Ada', account_number:'0123456789' };

test('withdraw with a valid issued OTP succeeds and holds balance', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u@x.co');
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: code, ...BANK }, token);
    assert.equal(res.status, 200);
    assert.ok((await res.json()).reference);
    assert.equal((await (await a.get('/api/user/profile', token)).json()).balance_minor, 6000);
  });
});
test('withdraw without OTP is rejected', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u2@x.co');
    deps.helpers.creditUser(user.id, 10000, 'seed');
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: 'BADCODE1', ...BANK }, token);
    assert.equal(res.status, 401);
  });
});
test('withdraw above balance is rejected', async () => {
  await withApp(async ({ base, deps }) => {
    const a = api(base);
    const { token, user } = await userLogin(a, 'u3@x.co');
    deps.helpers.creditUser(user.id, 1000, 'seed');
    const atok = await adminToken(a);
    const { code } = await (await a.post('/api/admin/otps', { user_id: user.id }, atok)).json();
    const res = await a.post('/api/user/withdraw', { amount: '40.00', otp: code, ...BANK }, token);
    assert.equal(res.status, 400);
  });
});

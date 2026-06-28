const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

async function adminToken(a){ return (await (await a.post('/api/auth/login',{email:'admin@test.local',password:'AdminPass#123'})).json()).token; }
async function makeUser(a,email){ await a.post('/api/auth/register',{name:'User',email,password:'secret12',currency:'USD'}); return (await (await a.post('/api/auth/login',{email,password:'secret12'})).json()).user; }

test('admin issues a user-bound 8-char OTP', async () => {
  await withApp(async ({ base }) => {
    const a = api(base); const u = await makeUser(a,'o@x.co'); const tok = await adminToken(a);
    const res = await a.post('/api/admin/otps', { user_id: u.id, note: 'for payout' }, tok);
    const body = await res.json();
    assert.match(body.code, /^[A-Z0-9]{8}$/);
    const list = await (await a.get('/api/admin/otps', tok)).json();
    assert.equal(list[0].user_id, u.id);
    assert.equal(list[0].status, 'active');
  });
});

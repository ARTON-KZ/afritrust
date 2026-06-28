const { test } = require('node:test');
const assert = require('node:assert');
const { withApp, api } = require('./helpers');

test('health endpoint responds ok', async () => {
  await withApp(async ({ base }) => {
    const res = await api(base).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });
});

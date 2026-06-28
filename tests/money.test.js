const { test } = require('node:test');
const assert = require('node:assert');
const m = require('../backend/money');

test('isAllowedCurrency', () => {
  assert.equal(m.isAllowedCurrency('NGN'), true);
  assert.equal(m.isAllowedCurrency('MXN'), true);
  assert.equal(m.isAllowedCurrency('ARS'), true);
  assert.equal(m.isAllowedCurrency('mxn'), true); // case-insensitive
  assert.equal(m.isAllowedCurrency('xyz'), false);
});
test('formats Latin American pesos', () => {
  // MXN minor units → peso amount with 2 decimals
  assert.match(m.formatMoney(850000, 'MXN'), /8,500\.00/);
});
test('toMinor parses and rounds to cents', () => {
  assert.deepEqual(m.toMinor('10.50'), { ok: true, minor: 1050 });
  assert.deepEqual(m.toMinor('19.99'), { ok: true, minor: 1999 });
  assert.deepEqual(m.toMinor(1), { ok: true, minor: 100 });
  assert.equal(m.toMinor('abc').ok, false);
  assert.equal(m.toMinor(-5).ok, false);
  assert.equal(m.toMinor(0).ok, false);
});
test('fromMinor and formatMoney', () => {
  assert.equal(m.fromMinor(1050), 10.5);
  // 125000 minor units = 1,250.00 major
  assert.match(m.formatMoney(125000, 'USD'), /1,250\.00/);
});

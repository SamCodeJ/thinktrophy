const test = require('node:test');
const assert = require('node:assert/strict');
const { retryDelayMs } = require('../src/services/outboundQueue');

test('retry delays grow after each failed attempt', () => {
  assert.equal(retryDelayMs(1), 30 * 1000);
  assert.equal(retryDelayMs(2), 2 * 60 * 1000);
  assert.equal(retryDelayMs(3), 5 * 60 * 1000);
  assert.equal(retryDelayMs(8), 12 * 60 * 60 * 1000);
});

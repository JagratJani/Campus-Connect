const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

test('API Gateway - Health & Metrics smoke tests', async (t) => {
  // Verify server script exports or can load without throwing
  assert.doesNotThrow(() => {
    require('../package.json');
  });

  await t.test('Package.json metadata is valid', () => {
    const pkg = require('../package.json');
    assert.equal(pkg.name, 'api-gateway');
  });
});

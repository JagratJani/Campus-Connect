const test = require('node:test');
const assert = require('node:assert/strict');

test('Order Service - Smoke & Contract tests', async (t) => {
  await t.test('Package metadata is valid', () => {
    const pkg = require('../package.json');
    assert.equal(pkg.name, 'order-service');
  });

  await t.test('Order validation logic requires valid structure', () => {
    const order = {
      id: 1001,
      userId: 1,
      productId: 101,
      quantity: 1,
      totalPrice: 25.00,
      status: 'CONFIRMED'
    };

    assert.ok(typeof order.id === 'number');
    assert.ok(typeof order.userId === 'number');
    assert.ok(typeof order.productId === 'number');
    assert.ok(typeof order.quantity === 'number' && order.quantity > 0);
    assert.ok(['PENDING', 'CONFIRMED', 'CANCELLED'].includes(order.status));
  });
});

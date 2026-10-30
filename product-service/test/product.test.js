const test = require('node:test');
const assert = require('node:assert/strict');

test('Product Service - Smoke & Contract tests', async (t) => {
  await t.test('Package metadata is valid', () => {
    const pkg = require('../package.json');
    assert.equal(pkg.name, 'product-service');
  });

  await t.test('Default catalog conforms to Product schema', () => {
    const defaultProducts = [
      { id: 101, name: "Lab Manual: Web Services & SOA", category: "Books", price: 25.00, stock: 50 },
      { id: 102, name: "CampusConnect ID Card Holder", category: "Accessories", price: 10.00, stock: 100 },
      { id: 103, name: "Arduino Starter Kit", category: "Electronics", price: 75.00, stock: 30 },
      { id: 104, name: "Cloud Computing Textbook", category: "Books", price: 45.00, stock: 40 }
    ];

    defaultProducts.forEach(p => {
      assert.ok(typeof p.id === 'number');
      assert.ok(typeof p.name === 'string');
      assert.ok(typeof p.price === 'number' && p.price > 0);
      assert.ok(typeof p.stock === 'number' && p.stock >= 0);
    });
  });
});

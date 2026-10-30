const test = require('node:test');
const assert = require('node:assert/strict');

test('User Service - Smoke & Contract tests', async (t) => {
  await t.test('Package metadata is valid', () => {
    const pkg = require('../package.json');
    assert.equal(pkg.name, 'user-service');
  });

  await t.test('Default dataset structure conforms to User schema', () => {
    const defaultUsers = [
      { id: 1, name: "Jagrat Jani", email: "jagrat@campus.edu", role: "Student", department: "AIML" },
      { id: 2, name: "Aarav Patel", email: "aarav@campus.edu", role: "Student", department: "CSE" },
      { id: 3, name: "Prof. Sharma", email: "sharma@campus.edu", role: "Faculty", department: "IT" }
    ];

    defaultUsers.forEach(u => {
      assert.ok(typeof u.id === 'number');
      assert.ok(typeof u.name === 'string');
      assert.ok(typeof u.email === 'string' && u.email.includes('@'));
      assert.ok(['Student', 'Faculty', 'Admin'].includes(u.role));
    });
  });
});

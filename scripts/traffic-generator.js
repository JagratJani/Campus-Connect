#!/usr/bin/env node

/**
 * CampusConnect - Automated Traffic & Load Generator (Lab 8)
 * ============================================================
 * Sends a mix of valid and controlled error requests to the API Gateway
 * to populate Prometheus metrics and drive Grafana dashboards.
 *
 * Usage:
 *   node scripts/traffic-generator.js [gateway_url] [total_batches]
 *
 * Examples:
 *   node scripts/traffic-generator.js http://localhost:3000 5
 *   node scripts/traffic-generator.js http://localhost:30080 10
 */

const BASE_URL = process.argv[2] || process.env.GATEWAY_URL || 'http://localhost:3000';
const BATCHES = parseInt(process.argv[3] || '5', 10);
const DELAY_MS = 250;

console.log('============================================================');
console.log(`🚀 Starting CampusConnect Traffic Generator`);
console.log(`   Target Gateway: ${BASE_URL}`);
console.log(`   Batches:        ${BATCHES} (12 requests per batch = ${BATCHES * 12} total requests)`);
console.log('============================================================\n');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stats = {
  total: 0,
  success2xx: 0,
  client4xx: 0,
  server5xx: 0,
  errors: 0
};

async function executeRequest(label, path, method = 'GET', body = null) {
  stats.total++;
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  
  try {
    const options = {
      method,
      headers: { 'Accept': 'application/json' }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const duration = Date.now() - start;

    if (res.status >= 200 && res.status < 300) stats.success2xx++;
    else if (res.status >= 400 && res.status < 500) stats.client4xx++;
    else if (res.status >= 500) stats.server5xx++;

    console.log(`[${res.status}] ${method.padEnd(4)} ${path.padEnd(25)} | ${duration}ms | ${label}`);
  } catch (err) {
    stats.errors++;
    console.error(`[ERR] ${method.padEnd(4)} ${path.padEnd(25)} | FAILED: ${err.message}`);
  }
}

async function run() {
  for (let b = 1; b <= BATCHES; b++) {
    console.log(`--- [ Batch ${b}/${BATCHES} ] ---`);

    // 1. Health checks & metrics
    await executeRequest('Gateway Health', '/health');
    await executeRequest('Prometheus Metrics', '/metrics');

    // 2. Read Users
    await executeRequest('List All Users', '/users');
    await executeRequest('Get User #1', '/users/1');

    // 3. Read Products
    await executeRequest('List All Products', '/products');
    await executeRequest('Get Product #101', '/products/101');

    // 4. Read Orders
    await executeRequest('List All Orders', '/orders');

    // 5. Create Operations (201 Created)
    await executeRequest('Create Test User', '/users', 'POST', {
      name: `LoadUser_${Date.now()}`,
      email: `user_${Date.now()}@campus.edu`,
      role: 'Student',
      department: 'AIML'
    });

    await executeRequest('Create Order', '/orders', 'POST', {
      userId: 1,
      productId: 101,
      quantity: 1
    });

    // 6. Controlled Error Scenarios (to verify 4xx monitoring)
    await executeRequest('Intentional 404 (Missing User)', '/users/99999');
    await executeRequest('Intentional 404 (Missing Product)', '/products/99999');
    await executeRequest('Intentional 404 (Invalid Gateway Route)', '/invalid-endpoint-test');

    await sleep(DELAY_MS);
  }

  console.log('\n============================================================');
  console.log('📊 Traffic Generation Complete Summary:');
  console.log(`   Total Requests: ${stats.total}`);
  console.log(`   2xx Successes:  ${stats.success2xx}`);
  console.log(`   4xx Errors:     ${stats.client4xx}`);
  console.log(`   5xx Errors:     ${stats.server5xx}`);
  console.log(`   Network Errs:   ${stats.errors}`);
  console.log('============================================================\n');
}

run();

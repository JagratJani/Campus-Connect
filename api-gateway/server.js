/**
 * CampusConnect - API Gateway (Lab 7)
 * ============================================================
 * Single entry point for all client requests.
 * Routes /users    → User Service
 *        /products → Product Service
 *        /orders   → Order Service
 *
 * Cross-cutting concerns handled here:
 *   - Request logging (method, path, target service, response status, duration)
 *   - Centralized 502/503 error handling for unreachable services
 *   - GET /health for gateway liveness
 *
 * Service URLs are read from environment variables (service registry)
 * — never hard-coded — satisfying Part B (configuration-based discovery).
 * ============================================================
 */

'use strict';

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3000;

// ────────────────────────────────────────────────────────────
// Service Registry  (Part B – configuration-based discovery)
// Values come from environment variables; no URL is hard-coded
// inside route-handling code.
// ────────────────────────────────────────────────────────────
const serviceRegistry = {
  user:    process.env.USER_SERVICE_URL    || 'http://user-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  order:   process.env.ORDER_SERVICE_URL   || 'http://order-service:3003',
};

console.log('==============================================');
console.log('🗺  Service Registry loaded:');
console.log(`   USER_SERVICE_URL    → ${serviceRegistry.user}`);
console.log(`   PRODUCT_SERVICE_URL → ${serviceRegistry.product}`);
console.log(`   ORDER_SERVICE_URL   → ${serviceRegistry.order}`);
console.log('==============================================');

// ────────────────────────────────────────────────────────────
// Middleware
// NOTE: express.json() is intentionally NOT used here.
// The gateway is a pure reverse-proxy — it must never parse
// the request body. Parsing consumes the readable stream, so
// the proxy would forward an empty body to the backend on
// POST/PUT requests. CORS is still applied for browser clients.
// ────────────────────────────────────────────────────────────
app.use(cors());

// ────────────────────────────────────────────────────────────
// Request logging middleware
// ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  let targetService = 'gateway';
  if (req.path.startsWith('/users'))    targetService = `user-service    → ${serviceRegistry.user}`;
  else if (req.path.startsWith('/products')) targetService = `product-service → ${serviceRegistry.product}`;
  else if (req.path.startsWith('/orders'))   targetService = `order-service   → ${serviceRegistry.order}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[gateway] ${timestamp} | ${req.method} ${req.originalUrl} | target: ${targetService} | status: ${res.statusCode} | ${duration}ms`
    );
  });

  next();
});

// ────────────────────────────────────────────────────────────
// Gateway Health Check (handled directly — never proxied)
// ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    registry: {
      userService:    serviceRegistry.user,
      productService: serviceRegistry.product,
      orderService:   serviceRegistry.order,
    },
  });
});

// ────────────────────────────────────────────────────────────
// Centralized error handler for unreachable services
// Returns 502 Bad Gateway or 503 Service Unavailable
// ────────────────────────────────────────────────────────────
function makeErrorHandler(serviceName) {
  return (err, req, res) => {
    const isTimeout = err.code === 'ECONNRESET' || err.message?.includes('timeout');
    const status = isTimeout ? 503 : 502;
    const label  = isTimeout ? 'Service Unavailable' : 'Bad Gateway';

    console.error(`[gateway] ⚠  ${serviceName} unreachable — ${err.code || err.message}`);

    if (!res.headersSent) {
      res.status(status).json({
        error: `${label}: ${serviceName} is unreachable or not responding.`,
        service: serviceName,
        code: err.code || 'PROXY_ERROR',
        gateway: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// ────────────────────────────────────────────────────────────
// Proxy factory
//
// When Express mounts middleware at app.use('/users', fn),
// it strips the prefix from req.url (e.g. GET /users/1 →
// req.url = '/1'). We restore the full path from
// req.originalUrl before the proxy middleware sees the request,
// so the backend receives GET /users/1 — not GET /1.
//
// This wrapper + restore pattern works reliably across all
// versions of http-proxy-middleware.
// ────────────────────────────────────────────────────────────
function makeProxy(target, serviceName) {
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 10000,
    on: {
      error: makeErrorHandler(serviceName),
    },
  });

  // Return a standard Express middleware that restores req.url then proxies
  return (req, res, next) => {
    req.url = req.originalUrl; // restore full path (e.g. /users/1)
    proxy(req, res, next);
  };
}

// ────────────────────────────────────────────────────────────
// Route Table  (Part A + Part B)
// Target URLs come from serviceRegistry (env vars) — no
// literal service address appears in this routing logic.
// ────────────────────────────────────────────────────────────
app.use('/users',    makeProxy(serviceRegistry.user,    'user-service'));
app.use('/products', makeProxy(serviceRegistry.product, 'product-service'));
app.use('/orders',   makeProxy(serviceRegistry.order,   'order-service'));

// ────────────────────────────────────────────────────────────
// 404 — unknown gateway route
// ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found on API Gateway.',
    path: req.originalUrl,
    availableRoutes: ['/health', '/users', '/products', '/orders'],
  });
});

// ────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==============================================`);
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/health`);
  console.log(`   Users:    http://localhost:${PORT}/users`);
  console.log(`   Products: http://localhost:${PORT}/products`);
  console.log(`   Orders:   http://localhost:${PORT}/orders`);
  console.log(`==============================================`);
});

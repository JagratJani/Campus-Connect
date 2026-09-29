/**
 * CampusConnect - Order Microservice (Lab 6)
 * Responsibility: Create and retrieve Orders; validate referenced User and Product data through APIs.
 * Port: 3003 (default)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.ORDER_SERVICE_PORT || 3003;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

app.use(cors());
app.use(express.json());

// In-memory data store with disk persistence
let orders = [];
let nextId = 1001;

const DEFAULT_ORDERS = [
  {
    id: 1001,
    userId: 1,
    productId: 101,
    quantity: 1,
    totalPrice: 25.00,
    status: 'CONFIRMED',
    user: { id: 1, name: "Jagrat Jani", email: "jagrat@campus.edu", role: "Student" },
    product: { id: 101, name: "Lab Manual: Web Services & SOA", price: 25.00, category: "Books" },
    createdAt: new Date().toISOString()
  }
];

function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      orders = JSON.parse(raw);
      console.log(`[order-service] Loaded ${orders.length} orders from persistent storage.`);
    } else {
      orders = [...DEFAULT_ORDERS];
      saveStorage();
      console.log('[order-service] Initialized default order records.');
    }
    const maxId = orders.reduce((max, o) => Math.max(max, Number(o.id) || 0), 1000);
    nextId = maxId + 1;
  } catch (err) {
    console.error('[order-service] Storage initialization error:', err.message);
    orders = [...DEFAULT_ORDERS];
    nextId = 1002;
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('[order-service] Failed to persist data to disk:', err.message);
  }
}

initStorage();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[order-service] ${req.method} ${req.url}`);
  next();
});

// Resilient inter-service HTTP client with timeout & error handling
async function callDependency(url, serviceName) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return { ok: false, status: 404, data: null, error: `${serviceName} resource not found (404)` };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: 503,
        data: null,
        error: `${serviceName} responded with HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return { ok: true, status: 200, data, error: null };
  } catch (err) {
    console.error(`[order-service] Inter-service call failed for ${serviceName} at ${url}:`, err.message);
    return {
      ok: false,
      status: 503,
      data: null,
      error: `${serviceName} unavailable (${err.name === 'AbortError' ? 'Request timed out' : err.message})`
    };
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'order-service',
    port: Number(PORT),
    userServiceUrl: USER_SERVICE_URL,
    productServiceUrl: PRODUCT_SERVICE_URL,
    timestamp: new Date().toISOString(),
    recordCount: orders.length
  });
});

// GET /orders - Retrieve all orders
app.get('/orders', (req, res) => {
  res.status(200).json(orders);
});

// GET /orders/:id - Retrieve an order by ID
app.get('/orders/:id', (req, res) => {
  const orderId = Number(req.params.id);
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({
      error: `Order with ID ${req.params.id} not found`,
      service: 'order-service'
    });
  }

  res.status(200).json(order);
});

// POST /orders - Create order (calls User Service and Product Service)
app.post('/orders', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  // Basic input validation
  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }
  if (!productId || isNaN(Number(productId))) {
    return res.status(400).json({ error: 'Valid productId is required' });
  }
  const qty = Number(quantity);
  if (!quantity || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive integer greater than 0' });
  }

  // 1. Validate User via User Service
  const userTargetUrl = `${USER_SERVICE_URL}/users/${userId}`;
  console.log(`[order-service] Validating user via GET ${userTargetUrl}`);
  const userResult = await callDependency(userTargetUrl, 'User Service');

  if (!userResult.ok) {
    if (userResult.status === 404) {
      return res.status(404).json({
        error: `User with ID ${userId} not found`,
        dependency: 'user-service',
        status: 404
      });
    }
    // Controlled error 503 when dependency is unavailable
    return res.status(503).json({
      error: 'User Service unavailable. Dependency check failed.',
      dependency: 'user-service',
      targetUrl: userTargetUrl,
      details: userResult.error,
      status: 503
    });
  }
  const user = userResult.data;

  // 2. Validate Product via Product Service
  const prodTargetUrl = `${PRODUCT_SERVICE_URL}/products/${productId}`;
  console.log(`[order-service] Validating product via GET ${prodTargetUrl}`);
  const prodResult = await callDependency(prodTargetUrl, 'Product Service');

  if (!prodResult.ok) {
    if (prodResult.status === 404) {
      return res.status(404).json({
        error: `Product with ID ${productId} not found`,
        dependency: 'product-service',
        status: 404
      });
    }
    // Controlled error 503 when dependency is unavailable
    return res.status(503).json({
      error: 'Product Service unavailable. Dependency check failed.',
      dependency: 'product-service',
      targetUrl: prodTargetUrl,
      details: prodResult.error,
      status: 503
    });
  }
  const product = prodResult.data;

  // Check inventory stock
  if (product.stock !== undefined && product.stock < qty) {
    return res.status(400).json({
      error: `Insufficient stock for product '${product.name}'. Requested: ${qty}, Available: ${product.stock}`
    });
  }

  // Calculate total price
  const totalPrice = Number((product.price * qty).toFixed(2));

  // Construct and save order
  const newOrder = {
    id: nextId++,
    userId: user.id,
    productId: product.id,
    quantity: qty,
    totalPrice: totalPrice,
    status: 'CONFIRMED',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category
    },
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  saveStorage();

  console.log(`[order-service] Order #${newOrder.id} successfully created! Total: $${totalPrice}`);
  res.status(201).json(newOrder);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===========================================`);
  console.log(`🚀 Order Service running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Base:    http://localhost:${PORT}/orders`);
  console.log(`   User URL:    ${USER_SERVICE_URL}`);
  console.log(`   Product URL: ${PRODUCT_SERVICE_URL}`);
  console.log(`===========================================`);
});

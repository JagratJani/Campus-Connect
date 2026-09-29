/**
 * CampusConnect - Product Microservice (Lab 6)
 * Responsibility: Manage Product resources used by the application.
 * Port: 3002 (default)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.PRODUCT_SERVICE_PORT || 3002;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

app.use(cors());
app.use(express.json());

// In-memory data store with disk persistence
let products = [];
let nextId = 101;

const DEFAULT_PRODUCTS = [
  { id: 101, name: "Lab Manual: Web Services & SOA", category: "Books", price: 25.00, stock: 50 },
  { id: 102, name: "CampusConnect ID Card Holder", category: "Accessories", price: 10.00, stock: 100 },
  { id: 103, name: "Arduino Starter Kit", category: "Electronics", price: 75.00, stock: 30 },
  { id: 104, name: "Cloud Computing Textbook", category: "Books", price: 45.00, stock: 40 }
];

function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      products = JSON.parse(raw);
      console.log(`[product-service] Loaded ${products.length} products from persistent storage.`);
    } else {
      products = [...DEFAULT_PRODUCTS];
      saveStorage();
      console.log('[product-service] Initialized default product catalog.');
    }
    const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 100);
    nextId = maxId + 1;
  } catch (err) {
    console.error('[product-service] Storage initialization error:', err.message);
    products = [...DEFAULT_PRODUCTS];
    nextId = 105;
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('[product-service] Failed to persist data to disk:', err.message);
  }
}

initStorage();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[product-service] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'product-service',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    recordCount: products.length
  });
});

// GET /products - Retrieve all products
app.get('/products', (req, res) => {
  res.status(200).json(products);
});

// GET /products/:id - Retrieve a product by ID
app.get('/products/:id', (req, res) => {
  const prodId = Number(req.params.id);
  const product = products.find(p => p.id === prodId);

  if (!product) {
    return res.status(404).json({
      error: `Product with ID ${req.params.id} not found`,
      service: 'product-service'
    });
  }

  res.status(200).json(product);
});

// POST /products - Create a new product
app.post('/products', (req, res) => {
  const { name, category, price, stock } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required and must be non-empty' });
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
    return res.status(400).json({ error: 'stock must be a non-negative number' });
  }

  const newProduct = {
    id: nextId++,
    name: name.trim(),
    category: category || 'General',
    price: Number(Number(price).toFixed(2)),
    stock: Math.floor(Number(stock)),
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  saveStorage();

  console.log(`[product-service] Created product ID ${newProduct.id} (${newProduct.name})`);
  res.status(201).json(newProduct);
});

// PUT /products/:id - Update an existing product
app.put('/products/:id', (req, res) => {
  const prodId = Number(req.params.id);
  const prodIndex = products.findIndex(p => p.id === prodId);

  if (prodIndex === -1) {
    return res.status(404).json({
      error: `Product with ID ${req.params.id} not found`,
      service: 'product-service'
    });
  }

  const { name, category, price, stock } = req.body;

  if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
    return res.status(400).json({ error: 'stock must be a non-negative number' });
  }

  products[prodIndex] = {
    ...products[prodIndex],
    ...(name && { name: name.trim() }),
    ...(category && { category }),
    ...(price !== undefined && { price: Number(Number(price).toFixed(2)) }),
    ...(stock !== undefined && { stock: Math.floor(Number(stock)) }),
    updatedAt: new Date().toISOString()
  };

  saveStorage();
  res.status(200).json(products[prodIndex]);
});

// DELETE /products/:id - Delete a product by ID
app.delete('/products/:id', (req, res) => {
  const prodId = Number(req.params.id);
  const prodIndex = products.findIndex(p => p.id === prodId);

  if (prodIndex === -1) {
    return res.status(404).json({
      error: `Product with ID ${req.params.id} not found`,
      service: 'product-service'
    });
  }

  const deletedProduct = products.splice(prodIndex, 1)[0];
  saveStorage();

  console.log(`[product-service] Deleted product ID ${prodId}`);
  res.status(200).json({
    message: `Product ${prodId} deleted successfully`,
    product: deletedProduct
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`============================================`);
  console.log(`🚀 Product Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Base:   http://localhost:${PORT}/products`);
  console.log(`============================================`);
});

/**
 * CampusConnect - User Microservice (Lab 6)
 * Responsibility: Create, retrieve, update, and delete User resources.
 * Port: 3001 (default)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.USER_SERVICE_PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

app.use(cors());
app.use(express.json());

// In-memory data store with disk persistence
let users = [];
let nextId = 1;

const DEFAULT_USERS = [
  { id: 1, name: "Jagrat Jani", email: "jagrat@campus.edu", role: "Student", department: "AIML" },
  { id: 2, name: "Aarav Patel", email: "aarav@campus.edu", role: "Student", department: "CSE" },
  { id: 3, name: "Prof. Sharma", email: "sharma@campus.edu", role: "Faculty", department: "IT" }
];

function initStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(raw);
      console.log(`[user-service] Loaded ${users.length} users from persistent storage.`);
    } else {
      users = [...DEFAULT_USERS];
      saveStorage();
      console.log('[user-service] Initialized default user records.');
    }
    const maxId = users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0);
    nextId = maxId + 1;
  } catch (err) {
    console.error('[user-service] Storage initialization error:', err.message);
    users = [...DEFAULT_USERS];
    nextId = 4;
  }
}

function saveStorage() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[user-service] Failed to persist data to disk:', err.message);
  }
}

initStorage();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[user-service] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'user-service',
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    recordCount: users.length
  });
});

// GET /users - Retrieve all users
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// GET /users/:id - Retrieve a user by ID
app.get('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: `User with ID ${req.params.id} not found`,
      service: 'user-service'
    });
  }

  res.status(200).json(user);
});

// POST /users - Create a new user
app.post('/users', (req, res) => {
  const { name, email, role, department } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name is required and must be non-empty' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'valid email is required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `User with email '${email}' already exists` });
  }

  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || 'Student',
    department: department || 'General',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStorage();

  console.log(`[user-service] Created user ID ${newUser.id} (${newUser.name})`);
  res.status(201).json(newUser);
});

// PUT /users/:id - Update an existing user
app.put('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      error: `User with ID ${req.params.id} not found`,
      service: 'user-service'
    });
  }

  const { name, email, role, department } = req.body;

  if (email) {
    const duplicate = users.find(u => u.id !== userId && u.email.toLowerCase() === email.trim().toLowerCase());
    if (duplicate) {
      return res.status(400).json({ error: `Email '${email}' is already in use by another user` });
    }
  }

  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name: name.trim() }),
    ...(email && { email: email.trim().toLowerCase() }),
    ...(role && { role }),
    ...(department && { department }),
    updatedAt: new Date().toISOString()
  };

  saveStorage();
  res.status(200).json(users[userIndex]);
});

// DELETE /users/:id - Delete a user by ID
app.delete('/users/:id', (req, res) => {
  const userId = Number(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({
      error: `User with ID ${req.params.id} not found`,
      service: 'user-service'
    });
  }

  const deletedUser = users.splice(userIndex, 1)[0];
  saveStorage();

  console.log(`[user-service] Deleted user ID ${userId}`);
  res.status(200).json({
    message: `User ${userId} deleted successfully`,
    user: deletedUser
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Base:   http://localhost:${PORT}/users`);
  console.log(`=========================================`);
});

/**
 * ============================================================
 *  CampusConnect – Student Management REST API (Lab 4)
 *  Backend: Express.js + MongoDB Atlas (Mongoose) + CORS
 *  Student: Jagrat Jani | CSE (AIML)
 * ============================================================
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const Student = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// ── In-Memory Fallback Store (Used if MongoDB connection is pending) ────
let inMemoryStudents = [
  { id: 1, name: 'Jagrat Jani', email: 'jagrat@campus.edu', course: 'Computer Science', semester: 4 },
  { id: 2, name: 'Aarav Patel', email: 'aarav@campus.edu', course: 'Information Technology', semester: 3 },
  { id: 3, name: 'Priya Sharma', email: 'priya@campus.edu', course: 'Electronics', semester: 5 }
];
let nextInMemoryId = 4;
let isMongoConnected = false;

// ── Mongoose Connection State Listeners ───────────────────────
mongoose.connection.on('connected', async () => {
  isMongoConnected = true;
  console.log('✅ Connected successfully to MongoDB!');
  try {
    const count = await Student.countDocuments();
    if (count === 0) {
      await Student.insertMany(inMemoryStudents);
      console.log('🌱 Database initialized with default student records.');
    }
  } catch (seedErr) {
    console.warn('Notice during DB seeding:', seedErr.message);
  }
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('⚠️ Mongoose disconnected from MongoDB.');
});

mongoose.connection.on('error', (err) => {
  isMongoConnected = false;
  console.warn('⚠️ MongoDB connection issue:', err.message);
});

// ── Connect to MongoDB ────────────────────────────────────────
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    isMongoConnected = true;
  })
  .catch(err => {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB initial connection failed (Running with in-memory sync fallback):', err.message);
  });
}

// ── Middleware ────────────────────────────────────────────────
// Enable Cross-Origin Resource Sharing (CORS) for React (localhost:5173 / localhost:3000)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve CampusConnect static portal
app.use(express.static(path.join(__dirname, '../Campus-connect')));

// ── OpenAPI / Swagger ─────────────────────────────────────────
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.warn('Swagger docs YAML load notice:', e.message);
}

// ── Validation Helper ─────────────────────────────────────────
function validateStudent(body, requireAll = true) {
  const errors = [];
  const { name, email, course, semester } = body;

  if (requireAll || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('name is required and must be a non-empty string');
    }
  }

  if (requireAll || email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push('email is required and must be a valid email address');
    }
  }

  if (requireAll || course !== undefined) {
    if (!course || typeof course !== 'string' || course.trim() === '') {
      errors.push('course is required and must be a non-empty string');
    }
  }

  if (requireAll || semester !== undefined) {
    const sem = Number(semester);
    if (semester === undefined || semester === null || !Number.isInteger(sem) || sem < 1 || sem > 12) {
      errors.push('semester is required and must be an integer between 1 and 12');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── REST API Routes ───────────────────────────────────────────

// GET /students — Retrieve all students
app.get('/students', async (req, res) => {
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const students = await Student.find().sort({ id: 1 }).lean();
      return res.status(200).json({
        status: 'success',
        storage: (isMongoConnected && mongoose.connection.readyState === 1) 
          ? (MONGODB_URI && MONGODB_URI.includes('cluster0') ? 'MongoDB Atlas' : 'MongoDB (Docker Container)')
          : 'In-Memory / Local Sync',
        count: students.length,
        data: students
      });
    } else {
      return res.status(200).json({
        status: 'success',
        storage: 'In-Memory / Local Sync',
        count: inMemoryStudents.length,
        data: inMemoryStudents
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to fetch students', error: err.message });
  }
});

// GET /students/:id — Retrieve student by ID
app.get('/students/:id', async (req, res) => {
  const paramId = req.params.id;
  const numId = parseInt(paramId);

  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      let query = !isNaN(numId) ? { id: numId } : (mongoose.Types.ObjectId.isValid(paramId) ? { _id: paramId } : null);
      if (!query) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }
      const student = await Student.findOne(query).lean();
      if (!student) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }
      return res.status(200).json({ status: 'success', data: student });
    } else {
      if (isNaN(numId)) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }
      const student = inMemoryStudents.find(s => s.id === numId);
      if (!student) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${numId} not found` });
      }
      return res.status(200).json({ status: 'success', data: student });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Error retrieving student', error: err.message });
  }
});

// POST /students — Create new student
app.post('/students', async (req, res) => {
  const { valid, errors } = validateStudent(req.body, true);
  if (!valid) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  const { name, email, course, semester } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const existing = await Student.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: `A student with email '${email}' already exists`
        });
      }

      const highest = await Student.findOne().sort({ id: -1 });
      const nextId = highest && highest.id ? highest.id + 1 : 1;

      const newStudent = await Student.create({
        id: nextId,
        name: name.trim(),
        email: normalizedEmail,
        course: course.trim(),
        semester: parseInt(semester)
      });

      return res.status(201).json({
        status: 'success',
        message: 'Student created successfully',
        data: newStudent
      });
    } else {
      const existing = inMemoryStudents.find(s => s.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: `A student with email '${email}' already exists`
        });
      }

      const newStudent = {
        id: nextInMemoryId++,
        name: name.trim(),
        email: normalizedEmail,
        course: course.trim(),
        semester: parseInt(semester)
      };
      inMemoryStudents.push(newStudent);

      return res.status(201).json({
        status: 'success',
        message: 'Student created successfully',
        data: newStudent
      });
    }
  } catch (err) {
    return res.status(400).json({
      status: 'error',
      message: err.code === 11000 ? `A student with email '${email}' already exists` : err.message
    });
  }
});

// PUT /students/:id — Full update / replace student record
app.put('/students/:id', async (req, res) => {
  const paramId = req.params.id;
  const numId = parseInt(paramId);

  const { valid, errors } = validateStudent(req.body, true);
  if (!valid) {
    return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
  }

  const { name, email, course, semester } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      let query = !isNaN(numId) ? { id: numId } : (mongoose.Types.ObjectId.isValid(paramId) ? { _id: paramId } : null);
      if (!query) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }

      // Check unique constraint for other students
      const conflict = await Student.findOne({ email: normalizedEmail, $nor: [query] });
      if (conflict) {
        return res.status(400).json({ status: 'error', message: `Email '${email}' is already in use by another student` });
      }

      const updated = await Student.findOneAndUpdate(
        query,
        { name: name.trim(), email: normalizedEmail, course: course.trim(), semester: parseInt(semester) },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Student updated successfully',
        data: updated
      });
    } else {
      if (isNaN(numId)) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }
      const index = inMemoryStudents.findIndex(s => s.id === numId);
      if (index === -1) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${numId} not found` });
      }

      inMemoryStudents[index] = {
        id: numId,
        name: name.trim(),
        email: normalizedEmail,
        course: course.trim(),
        semester: parseInt(semester)
      };

      return res.status(200).json({
        status: 'success',
        message: 'Student updated successfully',
        data: inMemoryStudents[index]
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to update student', error: err.message });
  }
});

// DELETE /students/:id — Delete student
app.delete('/students/:id', async (req, res) => {
  const paramId = req.params.id;
  const numId = parseInt(paramId);

  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      let query = !isNaN(numId) ? { id: numId } : (mongoose.Types.ObjectId.isValid(paramId) ? { _id: paramId } : null);
      if (!query) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }

      const deleted = await Student.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }

      return res.status(200).json({
        status: 'success',
        message: `Student with ID ${paramId} deleted successfully`,
        data: deleted
      });
    } else {
      if (isNaN(numId)) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${paramId} not found` });
      }
      const index = inMemoryStudents.findIndex(s => s.id === numId);
      if (index === -1) {
        return res.status(404).json({ status: 'error', message: `Student with ID ${numId} not found` });
      }
      const deleted = inMemoryStudents.splice(index, 1)[0];
      return res.status(200).json({
        status: 'success',
        message: `Student with ID ${numId} deleted successfully`,
        data: deleted
      });
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to delete student', error: err.message });
  }
});

// Health / Info endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'CampusConnect Student Management API',
    version: '2.0.0 (Lab 4)',
    database: (isMongoConnected && mongoose.connection.readyState === 1)
      ? (MONGODB_URI && MONGODB_URI.includes('cluster0') ? 'MongoDB Atlas (Connected)' : 'MongoDB Container (Connected)')
      : 'In-Memory Sync Mode',
    endpoints: {
      students: `http://localhost:${PORT}/students`,
      swagger: `http://localhost:${PORT}/api-docs`,
      reactClient: 'http://localhost:5173'
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('================================================');
  console.log(' CampusConnect Student REST API (Lab 4)');
  console.log('================================================');
  console.log(` Server running on:  http://localhost:${PORT}`);
  console.log(` Swagger Docs at:   http://localhost:${PORT}/api-docs`);
  console.log('================================================');
});

module.exports = app;

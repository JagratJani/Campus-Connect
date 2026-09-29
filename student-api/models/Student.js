const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  id: {
    type: Number,
    index: true
  },
  name: {
    type: String,
    required: [true, 'name is required and must be a non-empty string'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'email is required and must be a valid email address'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is required and must be a valid email address']
  },
  course: {
    type: String,
    required: [true, 'course is required and must be a non-empty string'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'semester is required and must be an integer between 1 and 12'],
    min: [1, 'semester is required and must be an integer between 1 and 12'],
    max: [12, 'semester is required and must be an integer between 1 and 12']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Auto-assign numeric id if not provided
studentSchema.pre('save', async function() {
  if (!this.id) {
    try {
      const highestStudent = await mongoose.model('Student').findOne().sort({ id: -1 }).exec();
      this.id = (highestStudent && highestStudent.id) ? highestStudent.id + 1 : 1;
    } catch (err) {
      this.id = Date.now();
    }
  }
});

module.exports = mongoose.model('Student', studentSchema);

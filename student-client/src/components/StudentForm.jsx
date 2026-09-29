import React, { useState, useEffect } from 'react';

export default function StudentForm({ currentStudent, onSave, onCancel, submitting, serverErrors }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    semester: 1
  });
  const [clientErrors, setClientErrors] = useState([]);

  useEffect(() => {
    if (currentStudent) {
      setFormData({
        name: currentStudent.name || '',
        email: currentStudent.email || '',
        course: currentStudent.course || '',
        semester: currentStudent.semester || 1
      });
    } else {
      setFormData({
        name: '',
        email: '',
        course: '',
        semester: 1
      });
    }
    setClientErrors([]);
  }, [currentStudent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) || '' : value
    }));
  };

  const validate = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    if (!formData.course.trim()) errors.push('Course is required');
    if (!formData.semester || formData.semester < 1 || formData.semester > 12) {
      errors.push('Semester must be between 1 and 12');
    }
    setClientErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  const isEdit = Boolean(currentStudent);

  return (
    <div className="card form-card mb-4">
      <div className="form-header">
        <h3>{isEdit ? `✏️ Edit Student #${currentStudent.id}` : '➕ Add New Student'}</h3>
        <span className="badge badge-endpoint">
          {isEdit ? `PUT /students/${currentStudent.id}` : 'POST /students'}
        </span>
      </div>

      {/* Client-Side Validation Errors */}
      {clientErrors.length > 0 && (
        <div className="alert alert-warning">
          <strong>Please fix the following:</strong>
          <ul>
            {clientErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Backend 400 Bad Request Errors */}
      {serverErrors && serverErrors.length > 0 && (
        <div className="alert alert-danger">
          <strong>Server Error (HTTP 400):</strong>
          <ul>
            {serverErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="e.g. Jagrat Jani"
              value={formData.name}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="e.g. jagrat@campus.edu"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Course / Branch *</label>
            <input
              type="text"
              name="course"
              className="form-control"
              placeholder="e.g. Computer Science (AIML)"
              value={formData.course}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>Semester (1-12) *</label>
            <input
              type="number"
              name="semester"
              className="form-control"
              min="1"
              max="12"
              value={formData.semester}
              onChange={handleChange}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="form-actions mt-3">
          {isEdit && (
            <button
              type="button"
              className="btn btn-secondary mr-2"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Processing...' : isEdit ? '💾 Update Student' : '➕ Create Student'}
          </button>
        </div>
      </form>
    </div>
  );
}

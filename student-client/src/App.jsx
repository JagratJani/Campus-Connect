import React, { useState, useEffect } from 'react';
import API_BASE_URL from './config';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import './App.css';

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all students (GET /students)
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch students from ${API_BASE_URL}`);
      }
      const result = await response.json();
      setStudents(result.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load data. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Create or Update Student (POST /students or PUT /students/:id)
  const handleSaveStudent = async (formData) => {
    setSubmitting(true);
    setServerErrors([]);

    const isEdit = Boolean(currentStudent);
    const url = isEdit
      ? `${API_BASE_URL}/students/${currentStudent.id || currentStudent._id}`
      : `${API_BASE_URL}/students`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          const errors = data.errors || [data.message || 'Validation failed'];
          setServerErrors(errors);
        } else if (response.status === 404) {
          setServerErrors(['Student not found (HTTP 404)']);
        } else {
          setServerErrors([data.message || 'Server error occurred']);
        }
        return;
      }

      showToast(isEdit ? 'Student updated successfully!' : 'Student created successfully!');
      setCurrentStudent(null);
      fetchStudents();
    } catch (err) {
      setServerErrors(['Network error: Failed to reach REST API. Check if server is running.']);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Student (DELETE /students/:id)
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}" (ID #${id})?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || 'Failed to delete student', 'danger');
        return;
      }

      showToast(`Student #${id} deleted successfully!`);
      fetchStudents();
    } catch (err) {
      showToast('Network error while deleting student', 'danger');
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast toast-${toastMessage.type}`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span className="logo-icon">🚀</span>
          <div>
            <h1>CampusConnect Student Client</h1>
            <p className="subtitle">Full-Stack React CRUD Client • Lab 4 (REST + MongoDB Atlas)</p>
          </div>
        </div>
        <div className="api-badge">
          <span className="status-dot"></span>
          <span>API: <code>{API_BASE_URL}</code></span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <StudentForm
          currentStudent={currentStudent}
          onSave={handleSaveStudent}
          onCancel={() => {
            setCurrentStudent(null);
            setServerErrors([]);
          }}
          submitting={submitting}
          serverErrors={serverErrors}
        />

        <StudentList
          students={students}
          onEdit={(student) => {
            setCurrentStudent(student);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onDelete={handleDeleteStudent}
          loading={loading}
          error={error}
          onRetry={fetchStudents}
        />
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© 2026 CampusConnect • Web Services & SOA Laboratory (Lab 4)</p>
        <p className="text-muted">Single Backend REST API consumed by React Web Client & Android Mobile App</p>
      </footer>
    </div>
  );
}

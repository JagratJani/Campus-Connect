import React from 'react';

export default function StudentList({ students, onEdit, onDelete, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="card text-center p-5">
        <div className="spinner"></div>
        <p className="mt-3 text-muted">Loading students from REST API / MongoDB Atlas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <div className="error-icon">⚠️</div>
        <div className="flex-1">
          <h4>Unable to load data</h4>
          <p>{error}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="card text-center p-5">
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎓</div>
        <h3>No students found</h3>
        <p className="text-muted">Add your first student using the form above.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive card">
      <div className="table-header-title">
        <h3>Registered Students ({students.length})</h3>
        <span className="badge badge-success">● Connected to REST API</span>
      </div>
      <table className="student-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id || student._id}>
              <td>
                <span className="badge badge-id">#{student.id}</span>
              </td>
              <td className="font-weight-600">{student.name}</td>
              <td className="text-muted">{student.email}</td>
              <td>
                <span className="badge badge-course">{student.course}</span>
              </td>
              <td>Sem {student.semester}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(student)}
                    title="Edit Student (PUT)"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete(student.id || student._id, student.name)}
                    title="Delete Student (DELETE)"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

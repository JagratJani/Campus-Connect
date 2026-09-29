package com.campusconnect.studentapi.service;

import com.campusconnect.studentapi.model.Student;
import com.campusconnect.studentapi.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * StudentService — Business Logic Layer
 *
 * Sits between Controller and Repository.
 * Handles business rules (e.g. duplicate email check).
 *
 * Architecture flow:
 *   StudentController → StudentService (this) → StudentRepository
 */
@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    /**
     * GET all students.
     * Flow: Service calls Repository.findAll() → returns List<Student>
     */
    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    /**
     * GET student by ID.
     * Flow: Service calls Repository.findById(id) → Optional<Student>
     */
    public Optional<Student> getStudentById(int id) {
        return repository.findById(id);
    }

    /**
     * POST — Create new student.
     * Business rule: reject duplicate email.
     * Flow: Service validates email → Repository.save() → returns created Student
     * @throws IllegalArgumentException if email already exists
     */
    public Student createStudent(Student student) {
        if (repository.emailExists(student.getEmail())) {
            throw new IllegalArgumentException(
                "A student with email '" + student.getEmail() + "' already exists"
            );
        }
        return repository.save(student);
    }

    /**
     * PUT — Full replace of student.
     * @return updated Student or empty if not found
     */
    public Optional<Student> updateStudent(int id, Student updated) {
        return repository.update(id, updated);
    }

    /**
     * PATCH — Partial update.
     * Merges only non-null fields from the request.
     */
    public Optional<Student> patchStudent(int id, Student patch) {
        Optional<Student> existing = repository.findById(id);
        if (existing.isEmpty()) return Optional.empty();

        Student current = existing.get();
        if (patch.getName()     != null) current.setName(patch.getName().trim());
        if (patch.getEmail()    != null) current.setEmail(patch.getEmail().toLowerCase().trim());
        if (patch.getCourse()   != null) current.setCourse(patch.getCourse().trim());
        if (patch.getSemester() != null) current.setSemester(patch.getSemester());

        return repository.update(id, current);
    }

    /**
     * DELETE — Remove student.
     * @return deleted Student or empty if not found
     */
    public Optional<Student> deleteStudent(int id) {
        return repository.deleteById(id);
    }
}

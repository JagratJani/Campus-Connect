package com.campusconnect.studentapi.repository;

import com.campusconnect.studentapi.model.Student;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * StudentRepository — In-Memory Data Store
 *
 * Simulates a database repository layer using a HashMap.
 * In Lab 4, this will be replaced with a real database (MongoDB/JPA).
 *
 * Architecture flow:
 *   Controller → Service → Repository (this class)
 */
@Repository
public class StudentRepository {

    // Thread-safe in-memory store
    private final Map<Integer, Student> store = new LinkedHashMap<>();
    private final AtomicInteger idCounter = new AtomicInteger(4);

    // ── Pre-load sample data ──────────────────────────────────
    public StudentRepository() {
        store.put(1, new Student(1, "Jagrat Jani",   "jagrat@campus.edu", "Computer Science",       4));
        store.put(2, new Student(2, "Aarav Patel",   "aarav@campus.edu",  "Information Technology", 3));
        store.put(3, new Student(3, "Priya Sharma",  "priya@campus.edu",  "Electronics",            5));
    }

    /** Return all students as an unmodifiable list */
    public List<Student> findAll() {
        return new ArrayList<>(store.values());
    }

    /** Find one student by ID, or empty Optional if not found */
    public Optional<Student> findById(int id) {
        return Optional.ofNullable(store.get(id));
    }

    /** Save a new student (auto-assign ID) */
    public Student save(Student student) {
        int newId = idCounter.getAndIncrement();
        student.setId(newId);
        student.setEmail(student.getEmail().toLowerCase().trim());
        student.setName(student.getName().trim());
        student.setCourse(student.getCourse().trim());
        store.put(newId, student);
        return student;
    }

    /** Update an existing student (replace all fields) */
    public Optional<Student> update(int id, Student updated) {
        if (!store.containsKey(id)) return Optional.empty();
        updated.setId(id);
        store.put(id, updated);
        return Optional.of(updated);
    }

    /** Delete a student by ID */
    public Optional<Student> deleteById(int id) {
        Student removed = store.remove(id);
        return Optional.ofNullable(removed);
    }

    /** Check if email is already taken by a different student */
    public boolean emailExistsForOtherId(String email, int excludeId) {
        return store.values().stream()
            .anyMatch(s -> s.getEmail().equalsIgnoreCase(email) && s.getId() != excludeId);
    }

    /** Check if email is already taken */
    public boolean emailExists(String email) {
        return store.values().stream()
            .anyMatch(s -> s.getEmail().equalsIgnoreCase(email));
    }
}

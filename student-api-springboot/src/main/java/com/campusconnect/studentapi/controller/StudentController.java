package com.campusconnect.studentapi.controller;

import com.campusconnect.studentapi.model.Student;
import com.campusconnect.studentapi.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * StudentController — REST API Layer
 *
 * Receives HTTP requests, delegates to StudentService, returns HTTP responses.
 *
 * Architecture flow:
 *   HTTP Request → StudentController (this) → StudentService → StudentRepository → JSON Response
 *
 * Endpoints exposed (port 8080):
 *   GET    /students        → getAllStudents()   → 200
 *   GET    /students/{id}   → getStudentById()   → 200 | 404
 *   POST   /students        → createStudent()    → 201 | 400
 *   PUT    /students/{id}   → updateStudent()    → 200 | 400 | 404
 *   PATCH  /students/{id}   → patchStudent()     → 200 | 400 | 404
 *   DELETE /students/{id}   → deleteStudent()    → 200 | 404
 */
@RestController
@RequestMapping("/students")
@Tag(name = "Students", description = "CRUD operations on the Student resource")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /students — List all students
    // Controller receives request → Service retrieves all → 200 OK
    // ─────────────────────────────────────────────────────────────
    @GetMapping
    @Operation(summary = "List all students", description = "Returns a list of all students in the in-memory store")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all students")
    public ResponseEntity<Map<String, Object>> getAllStudents() {
        List<Student> students = service.getAllStudents();
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "count",  students.size(),
            "data",   students
        ));
    }

    // ─────────────────────────────────────────────────────────────
    // GET /students/{id} — Get student by ID
    // Controller receives request → Service finds by ID → 200 | 404
    // ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    @Operation(summary = "Get a student by ID", description = "Returns a single student by their unique ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student found"),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<Map<String, Object>> getStudentById(
            @Parameter(description = "Unique student ID", example = "1")
            @PathVariable int id) {

        Optional<Student> found = service.getStudentById(id);

        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status",  "error",
                "message", "Student with ID " + id + " not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "data",   found.get()
        ));
    }

    // ─────────────────────────────────────────────────────────────
    // POST /students — Create new student
    // Controller validates JSON → Service creates → Repository saves → 201 Created
    // ─────────────────────────────────────────────────────────────
    @PostMapping
    @Operation(summary = "Create a new student", description = "Creates a student resource. All fields are required.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Student created"),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<Map<String, Object>> createStudent(
            @Valid @RequestBody Student student) {
        try {
            Student created = service.createStudent(student);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status",  "success",
                "message", "Student created successfully",
                "data",    created
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "status",  "error",
                "message", e.getMessage()
            ));
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PUT /students/{id} — Full replace
    // ─────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    @Operation(summary = "Replace a student (full update)", description = "Replaces all fields of an existing student")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<Map<String, Object>> updateStudent(
            @PathVariable int id,
            @Valid @RequestBody Student student) {

        Optional<Student> updated = service.updateStudent(id, student);

        if (updated.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status",  "error",
                "message", "Student with ID " + id + " not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "status",  "success",
            "message", "Student updated successfully",
            "data",    updated.get()
        ));
    }

    // ─────────────────────────────────────────────────────────────
    // PATCH /students/{id} — Partial update
    // ─────────────────────────────────────────────────────────────
    @PatchMapping("/{id}")
    @Operation(summary = "Partially update a student", description = "Updates only the provided fields")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student partially updated"),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<Map<String, Object>> patchStudent(
            @PathVariable int id,
            @RequestBody Student patch) {

        Optional<Student> updated = service.patchStudent(id, patch);

        if (updated.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status",  "error",
                "message", "Student with ID " + id + " not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "status",  "success",
            "message", "Student partially updated",
            "data",    updated.get()
        ));
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /students/{id} — Delete a student
    // ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a student", description = "Permanently removes a student from the store")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Student deleted"),
        @ApiResponse(responseCode = "404", description = "Student not found")
    })
    public ResponseEntity<Map<String, Object>> deleteStudent(@PathVariable int id) {
        Optional<Student> deleted = service.deleteStudent(id);

        if (deleted.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status",  "error",
                "message", "Student with ID " + id + " not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "status",  "success",
            "message", "Student with ID " + id + " deleted successfully",
            "data",    deleted.get()
        ));
    }
}

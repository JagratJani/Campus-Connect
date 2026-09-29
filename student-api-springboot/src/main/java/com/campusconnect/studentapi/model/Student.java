package com.campusconnect.studentapi.model;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

/**
 * Student Resource — Plain Java record with Bean Validation annotations.
 *
 * Fields: id (auto), name, email, course, semester
 *
 * Spring Boot uses this as the request/response JSON object via @RequestBody / @ResponseBody.
 */
@Schema(description = "Student resource representing a university student")
public class Student {

    @Schema(description = "Unique auto-generated student ID", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer id;

    @NotBlank(message = "name is required and must be a non-empty string")
    @Schema(description = "Full name of the student", example = "Jagrat Jani")
    private String name;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid email address")
    @Schema(description = "Unique email address of the student", example = "jagrat@campus.edu")
    private String email;

    @NotBlank(message = "course is required and must be a non-empty string")
    @Schema(description = "Course/programme enrolled in", example = "Computer Science")
    private String course;

    @NotNull(message = "semester is required")
    @Min(value = 1, message = "semester must be at least 1")
    @Max(value = 12, message = "semester must not exceed 12")
    @Schema(description = "Current semester (1–12)", example = "4")
    private Integer semester;

    // ── Constructors ──────────────────────────────────────────

    public Student() {}

    public Student(Integer id, String name, String email, String course, Integer semester) {
        this.id       = id;
        this.name     = name;
        this.email    = email;
        this.course   = course;
        this.semester = semester;
    }

    // ── Getters / Setters ─────────────────────────────────────

    public Integer getId()                    { return id; }
    public void    setId(Integer id)          { this.id = id; }
    public String  getName()                  { return name; }
    public void    setName(String name)       { this.name = name; }
    public String  getEmail()                 { return email; }
    public void    setEmail(String email)     { this.email = email; }
    public String  getCourse()                { return course; }
    public void    setCourse(String course)   { this.course = course; }
    public Integer getSemester()              { return semester; }
    public void    setSemester(Integer sem)   { this.semester = sem; }
}

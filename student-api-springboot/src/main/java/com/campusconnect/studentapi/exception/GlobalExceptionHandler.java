package com.campusconnect.studentapi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — Centralized Error Handling
 *
 * Catches validation errors and unknown exceptions globally,
 * returns structured JSON error responses.
 *
 * HTTP Status mapping:
 *   400 Bad Request  → Bean Validation failures, type mismatches
 *   500 Internal     → Unexpected runtime errors
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle @Valid/@Validated failures (e.g. blank name, invalid email, negative semester).
     * Returns HTTP 400 with all validation error messages.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> fe.getDefaultMessage())
            .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status",  "error",
            "message", "Validation failed",
            "errors",  errors
        ));
    }

    /**
     * Handle type mismatch (e.g. /students/abc instead of /students/1).
     * Returns HTTP 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
            "status",  "error",
            "message", "Invalid path variable '" + ex.getName() + "': must be an integer"
        ));
    }

    /**
     * Catch-all for unexpected server errors.
     * Returns HTTP 500.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericError(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "status",  "error",
            "message", "Internal Server Error",
            "detail",  ex.getMessage()
        ));
    }
}

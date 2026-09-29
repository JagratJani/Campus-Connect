package com.campusconnect.studentapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CampusConnect Student Management API
 * Lab 3: Building RESTful Web Services — Spring Boot Implementation
 *
 * Run: mvn spring-boot:run
 * API Base: http://localhost:8080
 * Swagger:  http://localhost:8080/swagger-ui/index.html
 */
@SpringBootApplication
public class StudentApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentApiApplication.class, args);
    }
}

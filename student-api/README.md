# CampusConnect – Student Management REST API
## Web Services & SOA Laboratory — Lab 3: Building RESTful Web Services

> **Student:** Jagrat Jani | 23CS0101 | CSE (AIML) Sem 4  
> **Framework:** Express.js (Complete CRUD) + Spring Boot (GET + POST equivalent)

---

## 📁 Project Structure

```
Lab 3/
├── student-api/                         ← EXPRESS.JS (Primary — Complete CRUD)
│   ├── server.js                        ← Main Express server + all routes
│   ├── openapi.yaml                     ← OpenAPI 3.0 specification (Swagger)
│   ├── package.json                     ← Node.js dependencies
│   └── node_modules/                    ← express, swagger-ui-express, yamljs
│
└── student-api-springboot/              ← SPRING BOOT (Equivalent — GET + POST)
    ├── pom.xml                          ← Maven dependencies
    └── src/main/java/com/campusconnect/studentapi/
        ├── StudentApiApplication.java   ← @SpringBootApplication entry point
        ├── model/
        │   └── Student.java             ← Resource model with @Valid annotations
        ├── controller/
        │   └── StudentController.java   ← @RestController — HTTP layer
        ├── service/
        │   └── StudentService.java      ← Business logic layer
        ├── repository/
        │   └── StudentRepository.java   ← In-memory HashMap data store
        └── exception/
            └── GlobalExceptionHandler.java ← @RestControllerAdvice error handling
```

---

## 🚀 How to Run

### Express.js API (Port 3000)
```bash
cd student-api
npm install
node server.js
```

- **API Base:**    http://localhost:3000
- **Swagger UI:**  http://localhost:3000/api-docs

### Spring Boot API (Port 8080)
```bash
cd student-api-springboot
mvn spring-boot:run
```
*(Requires Maven installed. Download from https://maven.apache.org/)*

- **API Base:**    http://localhost:8080
- **Swagger UI:**  http://localhost:8080/swagger-ui/index.html

---

## 📋 Student Resource

```json
{
  "id":       1,
  "name":     "Jagrat Jani",
  "email":    "jagrat@campus.edu",
  "course":   "Computer Science",
  "semester": 4
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `id` | integer | Auto-generated | Read-only |
| `name` | string | ✅ Yes | Non-empty string |
| `email` | string | ✅ Yes | Valid email format |
| `course` | string | ✅ Yes | Non-empty string |
| `semester` | integer | ✅ Yes | 1 – 12 |

---

## 🌐 API Endpoints (Express.js — Port 3000)

| Operation | Method | Endpoint | Status Codes |
|-----------|--------|----------|-------------|
| List all students | `GET` | `/students` | 200 OK |
| Get one student | `GET` | `/students/:id` | 200 OK / 404 Not Found |
| Create student | `POST` | `/students` | 201 Created / 400 Bad Request |
| Replace student | `PUT` | `/students/:id` | 200 OK / 400 / 404 |
| Partial update | `PATCH` | `/students/:id` | 200 OK / 400 / 404 |
| Delete student | `DELETE` | `/students/:id` | 200 OK / 404 Not Found |
| Swagger UI | `GET` | `/api-docs` | — |
| Health check | `GET` | `/` | 200 OK |

---

## 🔄 Sample Requests (Postman)

### GET all students
```
GET http://localhost:3000/students
```

### GET student by ID
```
GET http://localhost:3000/students/1
```

### POST — Create student
```
POST http://localhost:3000/students
Content-Type: application/json

{
  "name": "Aarav Patel",
  "email": "aarav@example.com",
  "course": "Computer Science",
  "semester": 5
}
```
**Response 201 Created:**
```json
{
  "status": "success",
  "message": "Student created successfully",
  "data": { "id": 4, "name": "Aarav Patel", "email": "aarav@example.com", "course": "Computer Science", "semester": 5 }
}
```

### PUT — Replace student
```
PUT http://localhost:3000/students/1
Content-Type: application/json

{
  "name": "Jagrat Jani",
  "email": "jagrat.updated@campus.edu",
  "course": "CSE (AIML)",
  "semester": 5
}
```

### PATCH — Partial update
```
PATCH http://localhost:3000/students/1
Content-Type: application/json

{ "semester": 6 }
```

### DELETE student
```
DELETE http://localhost:3000/students/1
```

---

## ❌ Error Responses

### Invalid Request Body (400 Bad Request)
```json
POST /students
{
  "name": "",
  "email": "invalid-email",
  "semester": -2
}
```
**Response:**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "name is required and must be a non-empty string",
    "email is required and must be a valid email address",
    "semester is required and must be an integer between 1 and 12"
  ]
}
```

### Invalid ID (404 Not Found)
```
GET /students/99
```
**Response:**
```json
{
  "status": "error",
  "message": "Student with ID 99 not found"
}
```

---

## 🔍 Framework Comparison (Lab Learning)

| Concern | Express.js | Spring Boot |
|---------|-----------|-------------|
| Routing | `app.get()`, `app.post()` etc. | `@GetMapping`, `@PostMapping` etc. |
| JSON parsing | `express.json()` middleware | `@RequestBody` annotation |
| Validation | Manual `if` checks in route | `@Valid` + Bean Validation (`@NotBlank`, `@Email`) |
| Business logic | Functions in route/service | `@Service` class |
| Data access | JS object / array | `@Repository` class |
| Error handling | `try/catch` + `app.use(err handler)` | `@RestControllerAdvice` |
| Swagger | `swagger-ui-express` + YAML | `springdoc-openapi` auto-generates |
| Port | 3000 | 8080 |

---

## 📌 API Design Exercise

### Why resource-oriented endpoints?

REST uses **nouns for resources** (not verbs):
- `/students` — the collection resource
- `/students/{id}` — a single student resource

### Why these HTTP methods?

| Method | Semantics | Use |
|--------|-----------|-----|
| `GET` | Safe + Idempotent | Reading data — no side effects |
| `POST` | Neither | Creating a new resource |
| `PUT` | Idempotent | Full replacement |
| `PATCH` | Partial | Partial update |
| `DELETE` | Idempotent | Removing a resource |

### Why these status codes?

| Code | Reason |
|------|--------|
| `200 OK` | Successful retrieval or update |
| `201 Created` | New resource successfully created |
| `204 No Content` | Deletion with no body (alternative) |
| `400 Bad Request` | Invalid or incomplete input |
| `404 Not Found` | Resource doesn't exist |
| `500 Internal Server Error` | Unexpected server failure |

---

## 🔌 Spring Boot Architecture Trace

```
GET /students → StudentController.getAllStudents()
              → StudentService.getAllStudents()
              → StudentRepository.findAll()
              → returns List<Student>
              → Controller wraps in ResponseEntity(200 OK)

POST /students → StudentController.createStudent(@Valid @RequestBody student)
               → Spring validates fields (@NotBlank, @Email, @Min, @Max)
               → StudentService.createStudent(student)
               → StudentRepository.save(student) ← assigns ID
               → Controller returns ResponseEntity(201 Created)

Validation fail → GlobalExceptionHandler.handleValidationErrors()
                → returns 400 Bad Request with error list
```

---

## 📦 OpenAPI / Swagger

- **Express.js Swagger UI:** http://localhost:3000/api-docs
- **Spring Boot Swagger UI:** http://localhost:8080/swagger-ui/index.html
- **OpenAPI YAML spec:** [openapi.yaml](./student-api/openapi.yaml)

---

*© 2026 CampusConnect · Web Services & SOA Lab 3 · Jagrat Jani*

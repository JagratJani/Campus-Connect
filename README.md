# CampusConnect – API Gateway, Service Discovery & Cloud Deployment (Lab 7)
## Web Services & SOA Laboratory — Lab 7: Gateway • Service Discovery • Cloud

> **Student:** Jagrat Jani | 202512119  
> **Course:** Web Services & SOA (Sem 3)  

---

## 1. Project Overview

**Lab 7** builds on the three-microservice system from Lab 6 by adding:

1. **API Gateway (`api-gateway`)** — a single public entry point that reverse-proxies all client requests to the correct backend service, adds centralized request logging, and returns clean 502/503 responses when a service is unreachable.
2. **Configuration-Based Service Discovery** — service locations are held in environment variables, not in source code, so URLs can be changed by editing configuration alone.
3. **Cloud Deployment on Render.com** — the full four-service stack runs as Docker containers with a public HTTPS URL for the gateway.

**Full-stack flow:**

```
Client / Postman → API Gateway (public) → User / Product / Order Service (Docker network) → Persistent Storage
```

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Internet / Client                                  │
│                              (Postman, Browser)                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │  HTTP(S)  :3000
                                    ▼
              ┌─────────────────────────────────────────┐
              │              API Gateway                 │
              │           (api-gateway :3000)            │  ← ONLY externally
              │                                          │    exposed port
              │  GET /health      →  gateway itself      │
              │  /users/*         →  user-service:3001   │
              │  /products/*      →  product-service:3002│
              │  /orders/*        →  order-service:3003  │
              │                                          │
              │  • Request logging (method/path/status)  │
              │  • 502/503 on unreachable service        │
              │  • Service URLs from env vars (registry) │
              └──────┬──────────────┬───────────────┬───┘
                     │              │               │
          ┌──────────▼──┐  ┌───────▼──────┐  ┌────▼──────────┐
          │ User Service│  │Product Service│  │ Order Service │
          │  :3001      │  │  :3002        │  │  :3003        │
          │ (internal)  │  │  (internal)   │  │  (internal)   │
          └──────┬──────┘  └───────┬───────┘  └────┬──────────┘
                 │                 │               │
          ┌──────▼──────┐  ┌───────▼───────┐      │
          │  User Data  │  │ Product Data  │      │
          │   Volume    │  │   Volume      │      │
          └─────────────┘  └───────────────┘      │
                                              ┌────▼────────┐
                                              │ Order Data  │
                                              │  Volume     │
                                              └─────────────┘
         ╔═══════════════════════════════════════════════════╗
         ║          campus-network  (Docker bridge)          ║
         ║   Services communicate by container name (DNS)    ║
         ╚═══════════════════════════════════════════════════╝
```

**Key architectural change from Lab 6:** Only `api-gateway:3000` is published on the host. The three backend services use `expose:` (Docker network only) — they cannot be reached directly from outside the Docker network.

---

## 3. Part A — API Gateway

### What the Gateway Does

| Concern | Implementation |
|:---|:---|
| **Routing** | `/users/*` → User Service, `/products/*` → Product Service, `/orders/*` → Order Service |
| **Proxy** | `http-proxy-middleware` with `changeOrigin: true` |
| **Health check** | `GET /health` — handled by the gateway itself, never proxied |
| **Request logging** | Every request logs: timestamp, method, path, target service, response status, duration |
| **Error handling** | Proxy error hook → 502 Bad Gateway / 503 Service Unavailable; no hanging |

### Gateway Endpoints

| Gateway Path | Routed To | Example |
|:---|:---|:---|
| `GET /health` | Gateway itself | `{ "status": "UP", "service": "api-gateway" }` |
| `GET /users` | User Service | Returns all users |
| `GET /users/:id` | User Service | Returns user by ID |
| `POST /users` | User Service | Creates a new user |
| `PUT /users/:id` | User Service | Updates a user |
| `DELETE /users/:id` | User Service | Deletes a user |
| `GET /products` | Product Service | Returns all products |
| `GET /products/:id` | Product Service | Returns product by ID |
| `POST /products` | Product Service | Creates a new product |
| `PUT /products/:id` | Product Service | Updates a product |
| `DELETE /products/:id` | Product Service | Deletes a product |
| `GET /orders` | Order Service | Returns all orders |
| `GET /orders/:id` | Order Service | Returns order by ID |
| `POST /orders` | Order Service | Places a new order |

### Why an API Gateway? (Discussion Question)

> **Q:** Why introduce an API Gateway instead of letting clients call each service directly?

Allowing clients to call each service directly creates several problems as a system grows:

1. **Multiple entry points** — clients must know the URL and port of every service. If a service moves, every client must be updated.
2. **Exposed internal structure** — the number, names, and locations of internal services become part of the public API contract, making refactoring painful.
3. **Duplicated cross-cutting concerns** — logging, CORS, authentication, rate-limiting, and error formatting would have to be implemented in every service individually.

An API Gateway solves all three: clients have **one address**, the internal topology is **hidden**, and concerns like logging and error handling are **centralized** in one place. In this lab, the gateway is the only container with a host-exposed port; the three backend services exist only inside the Docker bridge network.

---

## 4. Part B — Service Discovery (Configuration-Based)

### Service Registry

Service locations are defined as environment variables, not as literal strings in route-handling code:

```
USER_SERVICE_URL    → http://user-service:3001
PRODUCT_SERVICE_URL → http://product-service:3002
ORDER_SERVICE_URL   → http://order-service:3003
```

The gateway reads these at startup into a `serviceRegistry` object:

```js
const serviceRegistry = {
  user:    process.env.USER_SERVICE_URL    || 'http://user-service:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  order:   process.env.ORDER_SERVICE_URL   || 'http://order-service:3003',
};
```

Route definitions reference `serviceRegistry.user`, `serviceRegistry.product`, and `serviceRegistry.order` — never a hard-coded URL.

### Proving it Works (Config Change Without Code Change)

To move `user-service` to port 3011 (for example), change **only** the environment variable in `compose.yaml`:

```yaml
# api-gateway service
- USER_SERVICE_URL=http://user-service:3011   # was :3001
```

```yaml
# user-service
environment:
  - PORT=3011
expose:
  - "3011"
```

Restart the gateway (`docker compose restart api-gateway`) and it immediately routes `/users/*` to the new location. No code change, no rebuild of the gateway image.

### Static vs Dynamic Service Discovery

| Aspect | Static / Config-Based (this lab) | Dynamic (Consul, Eureka, Kubernetes DNS) |
|:---|:---|:---|
| **Registration** | Manual — set env var or config file | Automatic — service registers itself on startup |
| **Health awareness** | None — gateway does not know if a service is healthy | Registry tracks health; unhealthy instances are removed |
| **Scaling** | One URL per service; no load balancing | Registry returns multiple healthy instances; client or registry load-balances |
| **Location changes** | Require restart of the gateway | Propagated in real time; no restart needed |
| **Complexity** | Very low — just environment variables | Higher — requires running a registry daemon (Consul agent, Eureka server) |
| **Best for** | Small, stable deployments; student labs | Production microservices with auto-scaling and rolling deployments |

A dynamic registry (e.g. Kubernetes DNS) adds: automatic registration/deregistration, health-check-driven routing, real-time propagation of address changes, and support for multiple instances of the same service. A static config file cannot do any of these without a manual edit and restart.

---

## 5. Part C — Cloud Deployment

### Platform: Render.com (Free Tier)

All four microservices are containerized with Docker and deployed to **Render.com** using the Blueprint infrastructure specification [`render.yaml`](./render.yaml).

- **GitHub Repository:** [`https://github.com/JagratJani/Campus-Connect`](https://github.com/JagratJani/Campus-Connect)
- **Render Blueprint Name:** `Campus-Connect`
- **Active Branch:** `main`

### Live Deployed Services & Public URLs

| Service | Render Service Name | Type | Live Cloud URL | Status |
|:---|:---|:---|:---|:---|
| **API Gateway** | `campus-api-gateway` | Web Service (Public) | [`https://campus-api-gateway-re5k.onrender.com`](https://campus-api-gateway-re5k.onrender.com) | 🟢 Live |
| **User Service** | `campus-user-service` | Web Service (Internal) | [`https://campus-user-service-s3zg.onrender.com`](https://campus-user-service-s3zg.onrender.com) | 🟢 Live |
| **Product Service** | `campus-product-service` | Web Service (Internal) | [`https://campus-product-service-uqzj.onrender.com`](https://campus-product-service-uqzj.onrender.com) | 🟢 Live |
| **Order Service** | `campus-order-service` | Web Service (Internal) | [`https://campus-order-service.onrender.com`](https://campus-order-service.onrender.com) | 🟢 Live |

> 🌐 **Public API Gateway Entry Point:**  
> **`https://campus-api-gateway-re5k.onrender.com`**  
> *(All external requests from Postman or browsers must be sent only to this single public gateway endpoint)*

### Cloud Environment Variables (Service Registry on Cloud)

On Render, configuration-based service discovery is implemented via environment variables. The API Gateway and Order Service reference cloud URLs dynamically without changing application source code:

#### 1. API Gateway (`campus-api-gateway`) Environment Configuration:
| Environment Variable | Local Docker Value | Live Render Cloud Value |
|:---|:---|:---|
| `USER_SERVICE_URL` | `http://user-service:3001` | `https://campus-user-service-s3zg.onrender.com` |
| `PRODUCT_SERVICE_URL` | `http://product-service:3002` | `https://campus-product-service-uqzj.onrender.com` |
| `ORDER_SERVICE_URL` | `http://order-service:3003` | `https://campus-order-service.onrender.com` |

#### 2. Order Service (`campus-order-service`) Environment Configuration:
| Environment Variable | Local Docker Value | Live Render Cloud Value |
|:---|:---|:---|
| `USER_SERVICE_URL` | `http://user-service:3001` | `https://campus-user-service-s3zg.onrender.com` |
| `PRODUCT_SERVICE_URL` | `http://product-service:3002` | `https://campus-product-service-uqzj.onrender.com` |

### Cloud Deployment Steps Performed

1. **Repository Setup:** Committed and pushed all microservices, Dockerfiles, and `render.yaml` to GitHub repository `JagratJani/Campus-Connect`.
2. **Blueprint Deployment:** Created a new Blueprint on Render, linked to the `main` branch of `Campus-Connect`.
3. **Automated Docker Builds:** Render parsed `render.yaml` and built 4 separate Docker containers on Alpine Linux for each service.
4. **Service Discovery Configuration:** Configured the generated public HTTPS URLs into `campus-api-gateway` and `campus-order-service` environment variables.
5. **Gateway Verification:** Verified that `https://campus-api-gateway-re5k.onrender.com/health` returns `status: UP` and reflects all 3 downstream service URLs in its live registry.
6. **End-to-End Testing:** Re-tested all endpoints from Postman against the live cloud gateway URL, validating the full chain: Postman → API Gateway → User/Product/Order Services.

> **Note on Free Tier Sleep Behavior:** Render free tier instances spin down after 15 minutes of inactivity. When a request is made after an idle period, containers undergo a cold start (~30–50s). Subsequent requests respond with sub-second latency.

---

## 6. Service Responsibilities & Ports

| Service | Container Port | Host Port | Responsibility |
|:---|:---|:---|:---|
| `api-gateway` | 3000 | **3000** (only exposed one) | Routes requests, logs, error handling |
| `user-service` | 3001 | *none* | CRUD for user profiles |
| `product-service` | 3002 | *none* | CRUD for product catalog |
| `order-service` | 3003 | *none* | Create/query orders; calls User & Product services |

---

## 7. How to Run Locally

### Prerequisites
- Docker Desktop running
- Node.js 22+ (for local development only)

### Start All Services

```bash
# From the project root
docker compose up -d
```

All four containers start on `campus-network`. Only port `3000` (the gateway) is published to the host.

### Verify Running Containers

```bash
docker compose ps
```

Expected output:
```
NAME              IMAGE                        STATUS          PORTS
api-gateway       lab7-api-gateway             Up              0.0.0.0:3000->3000/tcp
order-service     lab7-order-service           Up
product-service   lab7-product-service         Up
user-service      lab7-user-service            Up
```

### Test via Postman (Local)

Base URL: `http://localhost:3000`

| Test | Request | Expected |
|:---|:---|:---|
| Gateway health | `GET /health` | `200 { "status": "UP", "service": "api-gateway" }` |
| List users | `GET /users` | `200` — array of users |
| Get user | `GET /users/1` | `200` — user object |
| Create user | `POST /users` | `201` — new user |
| List products | `GET /products` | `200` — array of products |
| Create product | `POST /products` | `201` — new product |
| List orders | `GET /orders` | `200` — array of orders |
| Create order | `POST /orders` `{ "userId": 1, "productId": 101, "quantity": 2 }` | `201` — new order |
| 502/503 test | Stop user-service, then `GET /users` | `502 Bad Gateway` |

### Test 502/503 Error Handling

```bash
# Stop the user service (simulates an unreachable dependency)
docker stop user-service

# Hit the gateway — should return 502, not hang
# GET http://localhost:3000/users
```

Expected response:
```json
{
  "error": "Bad Gateway: user-service is unreachable or not responding.",
  "service": "user-service",
  "code": "ECONNREFUSED",
  "gateway": "api-gateway",
  "timestamp": "2026-09-29T06:00:00.000Z"
}
```

```bash
# Restart the service — gateway recovers automatically
docker start user-service
```

---

## 8. Docker Compose Configuration

See [`compose.yaml`](./compose.yaml) for the full file. Key Lab 7 changes:

- `api-gateway` service added; ports: `"3000:3000"`
- `user-service`, `product-service`, `order-service` use `expose:` (Docker-internal only — **no** `ports:` mapping)
- Gateway environment variables define the service registry

---

## 9. Postman Testing Evidence

### Local (localhost:3000)

| # | Request | Status | Notes |
|:---|:---|:---|:---|
| 1 | `GET /health` | 200 | Gateway UP, shows registry |
| 2 | `GET /users` | 200 | Routed to user-service |
| 3 | `GET /users/1` | 200 | Single user retrieved |
| 4 | `POST /users` | 201 | User created via gateway |
| 5 | `GET /products` | 200 | Routed to product-service |
| 6 | `GET /products/101` | 200 | Single product retrieved |
| 7 | `POST /orders` | 201 | Order created; inter-service calls made |
| 8 | `GET /orders` | 200 | Orders listed |
| 9 | `GET /users` (user-service stopped) | 502 | Clean error, no hang |

### Cloud (https://campus-api-gateway-re5k.onrender.com)

All requests were tested against the live, public Render gateway URL from Postman, verifying the entire public-to-internal chain:

| # | Request URL | Method | Expected Status | Verified Status | Cloud Response Evidence / Notes |
|:---|:---|:---|:---|:---|:---|
| 1 | `https://campus-api-gateway-re5k.onrender.com/health` | `GET` | `200 OK` | `200 OK` | Gateway reports `UP`; registry lists all 3 live Render URLs |
| 2 | `https://campus-api-gateway-re5k.onrender.com/users` | `GET` | `200 OK` | `200 OK` | Returns array of user profiles (`Jagrat Jani`, etc.) from cloud user-service |
| 3 | `https://campus-api-gateway-re5k.onrender.com/users/1` | `GET` | `200 OK` | `200 OK` | Returns User ID 1 record (`Jagrat Jani`, `AIML`) |
| 4 | `https://campus-api-gateway-re5k.onrender.com/products` | `GET` | `200 OK` | `200 OK` | Returns catalog array (4 items) from cloud product-service |
| 5 | `https://campus-api-gateway-re5k.onrender.com/products/101` | `GET` | `200 OK` | `200 OK` | Returns item 101 (`Lab Manual: Web Services & SOA`) |
| 6 | `https://campus-api-gateway-re5k.onrender.com/orders` | `POST` | `201 Created` | `201 Created` | Order `#1002` created ($50); inter-service validation across cloud services |
| 7 | `https://campus-api-gateway-re5k.onrender.com/orders` | `GET` | `200 OK` | `200 OK` | Lists all confirmed orders placed in cloud storage |
| 8 | `https://campus-api-gateway-re5k.onrender.com/users/999` | `GET` | `404 Not Found` | `404 Not Found` | Clean 404 error routed from user-service via gateway |
| 9 | `https://campus-api-gateway-re5k.onrender.com/unknown` | `GET` | `404 Not Found` | `404 Not Found` | Gateway itself catches unknown route |

### Submission Screenshot Evidence (`Deployment-Screenshots/`)

All visual evidence required by the assignment checklist is organized in the [`Deployment-Screenshots/`](./Deployment-Screenshots/) directory:

- 📸 **Render Cloud Deployment Dashboard:** Shows all 4 microservice containers (`campus-api-gateway`, `campus-user-service`, `campus-product-service`, `campus-order-service`) in **Deployed (🟢 Live)** status on Render.com.
- 📸 **Gateway Health Check (`GET /health`):** Postman test verifying gateway liveness and runtime service registry populated with live Render URLs.
- 📸 **Users Route via Gateway (`GET /users`):** Postman test returning 200 OK with all user profile records.
- 📸 **Products Catalog via Gateway (`GET /products`):** Postman test returning 200 OK with product catalog entries.
- 📸 **Inter-Service Order Placement (`POST /orders`):** Postman test creating an order, showing end-to-end cloud inter-service communication (Gateway → Order Service → User + Product validation).
- 📸 **Error Handling & Resilience:** Postman testing demonstrating controlled 502 Bad Gateway / 404 Not Found behavior.

---

## 10. Troubleshooting

| Issue | Root Cause | Resolution |
|:---|:---|:---|
| `502 Bad Gateway` on all routes after `docker compose up` | Services not yet ready when gateway starts | `depends_on` in compose.yaml ensures start order; also `restart: unless-stopped` retries |
| Render free tier times out | Services spin down after 15 min inactivity | First request after idle takes ~60s; expected behavior on free plan |
| Gateway logs show wrong target URL | `USER_SERVICE_URL` env var not set / typo | Check `docker compose config` to verify resolved env vars; check gateway startup log |
| Order service 503 through gateway | User or Product service is down | Restart the respective service: `docker compose start user-service` |
| `ECONNREFUSED` in gateway logs | Service container not started | Run `docker compose ps` to check status; `docker compose up -d <service>` to start a specific one |

---

## 11. Reflection

> *What did the gateway and cloud deployment change about how the system is used and operated, compared to Lab 6?*

In Lab 6, a client (Postman, React, Android) had to know three separate ports — 3001, 3002, and 3003 — and communicate directly with each service. Adding, moving, or renaming a service required updating every client. With the API Gateway in Lab 7, the client talks to exactly one address (port 3000 locally, or the Render HTTPS URL in the cloud). The internal structure — how many services there are, what ports they use, where they live — is completely hidden. This also meant that concerns like request logging and error formatting now live in a single file rather than being scattered across three services. The cloud deployment step made the change tangible: running `docker compose up` on a Render VM and getting a live HTTPS URL accessible from any machine on the internet is qualitatively different from accessing `localhost`. It forced thinking about environment variables as the only safe way to configure service addresses, because there is no "localhost" to fall back on in the cloud.

---

## 12. Final Submission Checklist

### API Gateway
- [x] `api-gateway` service created (Express + `http-proxy-middleware`)
- [x] Routes `/users`, `/products`, `/orders` to correct backend services
- [x] `GET /health` endpoint implemented (gateway responds directly)
- [x] Request logging: method, path, target service, response status, duration
- [x] 502/503 centralized error handling for unreachable services
- [x] Only gateway port (`3000`) exposed externally in Docker Compose

### Service Discovery
- [x] Service URLs in `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL` env vars
- [x] No hard-coded URLs in route-handling code
- [x] Config change proven: change URL via env var only, no code edit required
- [x] Static vs dynamic discovery discussed in README (Section 4)

### Cloud Deployment
- [x] Cloud platform chosen: **Render.com**
- [x] Gateway and all three services deployed as Docker containers
- [x] Cloud env vars set for service URLs (same config-driven pattern)
- [x] Public gateway URL reachable from outside machine
- [x] `render.yaml` blueprint included in repo

### Evidence
- [x] Postman: gateway routes to all three services
- [x] Postman: `GET /health` check
- [x] Postman: 502/503 unreachable-service test documented
- [x] Postman: tests re-run against public cloud URL
- [x] Architecture diagram in README
- [x] Reflection (Section 11)

---

## 13. Project File Structure

```
Lab7_Api-Gateway/
├── api-gateway/                  ← NEW (Lab 7)
│   ├── server.js                 ← Gateway: routing, logging, error handling
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example              ← Service registry template
├── user-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── product-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── order-service/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── Deployment-Screenshots/       ← NEW: Postman & Cloud deployment screenshots
├── compose.yaml                  ← UPDATED (Lab 7): gateway added, services internal-only
├── render.yaml                   ← NEW (Lab 7): Render.com Blueprint with live service URLs
├── Microservices - Lab 6.postman_collection.json
└── README.md                     ← UPDATED (Lab 7)
```

---

*© 2026 CampusConnect · Web Services & SOA Lab 7: API Gateway & Cloud Deployment · Jagrat Jani | 202512119*

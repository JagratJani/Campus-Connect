# CampusConnect – API Gateway, Service Discovery & Cloud Deployment (Lab 7)
## Web Services & SOA Laboratory — Lab 7: Gateway • Service Discovery • Cloud

> **Student:** Jagrat Jani | 23CS0101 | CSE (AIML)  
> **Course:** Web Services & SOA Laboratory (Sem 3)  
> **Topic:** API Gateway · Configuration-Based Service Discovery · Cloud Deployment on Render

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

All four services are deployed as Docker containers on **Render.com** using the included [`render.yaml`](./render.yaml) Blueprint.

### Deployed Services

| Service | Render Service Name | Public URL |
|:---|:---|:---|
| API Gateway | `campus-api-gateway` | `https://campus-api-gateway.onrender.com` |
| User Service | `campus-user-service` | `https://campus-user-service.onrender.com` (internal) |
| Product Service | `campus-product-service` | `https://campus-product-service.onrender.com` (internal) |
| Order Service | `campus-order-service` | `https://campus-order-service.onrender.com` (internal) |

> **Public gateway URL:** `https://campus-api-gateway.onrender.com`

### Cloud Environment Variables (Service Registry on Cloud)

On Render, the same env-var pattern is used. No code changes are needed — only the variable values change from Docker DNS names to Render public URLs:

| Variable | Docker Compose Value | Render Cloud Value |
|:---|:---|:---|
| `USER_SERVICE_URL` | `http://user-service:3001` | `https://campus-user-service.onrender.com` |
| `PRODUCT_SERVICE_URL` | `http://product-service:3002` | `https://campus-product-service.onrender.com` |
| `ORDER_SERVICE_URL` | `http://order-service:3003` | `https://campus-order-service.onrender.com` |

This is the same config-driven discovery from Part B, now pointing to cloud URLs instead of Docker DNS names.

### Deployment Steps

1. Push this repository to GitHub (ensure `render.yaml` is at the root).
2. Log in to [render.com](https://render.com) → **New** → **Blueprint**.
3. Connect your GitHub repository.
4. Render reads `render.yaml` and creates all four Web Services automatically.
5. Wait for all four services to deploy (first deploy can take 3–5 minutes per service on free tier).
6. After the three microservices have deployed, copy their Render public URLs and set them as environment variables on `campus-api-gateway`:
   - `USER_SERVICE_URL` → URL of `campus-user-service`
   - `PRODUCT_SERVICE_URL` → URL of `campus-product-service`
   - `ORDER_SERVICE_URL` → URL of `campus-order-service`
7. Trigger a manual redeploy of the gateway to pick up the new variables.
8. Test `GET https://campus-api-gateway.onrender.com/health` from Postman.

> **Free tier note:** Render free web services spin down after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds. This is a platform limitation, not an application bug.

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

### Cloud (https://campus-api-gateway.onrender.com)

Same tests repeated against the public URL confirm the full gateway → service → storage chain works over the internet.

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
├── compose.yaml                  ← UPDATED (Lab 7): gateway added, services internal-only
├── render.yaml                   ← NEW (Lab 7): Render.com Blueprint
├── Microservices - Lab 6.postman_collection.json
└── README.md                     ← UPDATED (Lab 7)
```

---

*© 2026 CampusConnect · Web Services & SOA Lab 7: API Gateway & Cloud Deployment · Jagrat Jani | 23CS0101*

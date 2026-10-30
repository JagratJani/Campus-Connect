# CampusConnect – Lab 8: Kubernetes, Monitoring & CI/CD
## Web Services & SOA Laboratory — Lab 8: K8s • Prometheus • Grafana • CI/CD

> **Student:** Jagrat Jani | 202512119  
> **Course:** Web Services & SOA (Sem 3)

---

## 1. What Was Added in Lab 8

Building on the **Lab 7** API Gateway + three-microservice system, Lab 8 adds:

| Feature | Details |
|---------|---------|
| **Prometheus Metrics** | `/metrics` endpoint on all 4 services (Counter + Histogram per route/method/status) |
| **Kubernetes Manifests** | Full `k8s/` folder — Namespace, ConfigMap, Deployments, Services for all services + Prometheus + Grafana |
| **Grafana Dashboard** | Auto-provisioned dashboard: traffic rate, latency, error rate, status distribution |
| **CI/CD Pipeline** | GitHub Actions: test → validate K8s → build & push to GHCR on every push to main |
| **Unit Tests** | Node built-in `node:test` suite in each service |
| **Traffic Generator** | `scripts/traffic-generator.js` — populates real Prometheus/Grafana data |

---

## 2. Architecture Diagram

```
                        Internet / Client
                         (Postman, Browser)
                                │  :3000 (NodePort 30080 in K8s)
                                ▼
                    ┌─────────────────────────┐
                    │       API Gateway        │
                    │ GET /health  →  gateway  │  ← ONLY externally exposed
                    │ GET /metrics → Prometheus│
                    │ /users/*   → user-svc   │
                    │ /products/* → product-svc│
                    │ /orders/*  → order-svc  │
                    └────┬────────┬───────┬───┘
                         │        │       │
               ┌─────────▼──┐ ┌───▼──────┐ ┌▼──────────────┐
               │User Service│ │Product   │ │Order Service   │
               │  :3001     │ │Service   │ │  :3003         │
               │ /metrics   │ │  :3002   │ │ /metrics       │
               └────────────┘ │ /metrics │ └───────────────-┘
                              └──────────┘
                                    ↑ scrape every 5s
                    ┌───────────────────────────────┐
                    │    Prometheus  :9090           │
                    │  (NodePort 30090 in K8s)       │
                    └──────────────┬────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │    Grafana  :3000              │
                    │  (NodePort 30030 in K8s)       │
                    │  Auto-provisioned dashboard    │
                    └───────────────────────────────┘
```

---

## 3. Quick Start (Docker Compose — Lab 7 flow, still works)

```bash
# Start all 4 services
docker compose up -d --build

# Verify
curl http://localhost:3000/health
curl http://localhost:3000/metrics   # ← NEW: Prometheus metrics
curl http://localhost:3000/users
curl http://localhost:3000/products
curl http://localhost:3000/orders
```

---

## 4. Kubernetes Deployment (Lab 8)

> **Pre-requisite:** Enable Kubernetes in Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart

```bash
# 1. Apply all manifests
kubectl apply -f k8s/

# 2. Verify pods are running
kubectl get pods -n lab8

# 3. Check services
kubectl get svc -n lab8

# 4. Access the running stack
# API Gateway:  http://localhost:30080
# Prometheus:   http://localhost:30090
# Grafana:      http://localhost:30030 (admin / admin)
```

### Kubernetes Resources Created

| Resource | Kind | Description |
|---------|------|-------------|
| `lab8` | Namespace | Dedicated namespace for this lab |
| `campus-config` | ConfigMap | Service URLs + ports (service discovery) |
| `api-gateway` | Deployment + NodePort Service | Gateway, port 30080 |
| `user-service` | Deployment + ClusterIP Service | Internal, port 3001 |
| `product-service` | Deployment + ClusterIP Service | Internal, port 3002 |
| `order-service` | Deployment + ClusterIP Service | Internal, port 3003 |
| `prometheus` | Deployment + NodePort Service | Metrics server, port 30090 |
| `grafana` | Deployment + NodePort Service | Dashboards, port 30030 |
| `prometheus-config` | ConfigMap | Scrape config for all 4 services |
| `grafana-datasources` | ConfigMap | Auto-configure Prometheus datasource |
| `grafana-dashboards` | ConfigMap | Pre-built CampusConnect dashboard |

---

## 5. Prometheus Metrics (Lab 8)

All 4 services expose `/metrics` with:

- **`http_requests_total`** — Counter by `method`, `route`, `status`
- **`http_request_duration_seconds`** — Histogram with P50/P95/P99 buckets
- **Default Node.js process metrics** (CPU, memory, event loop)

### Useful PromQL Queries

```promql
# Request rate by route (1m window)
sum by (route) (rate(http_requests_total[1m]))

# Error rate (4xx + 5xx)
sum(http_requests_total{status=~"[45].."}) / sum(http_requests_total)

# P95 latency on /users
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{route="/users"}[5m]))

# Average latency (ms)
(sum(rate(http_request_duration_seconds_sum[1m])) / sum(rate(http_request_duration_seconds_count[1m]))) * 1000
```

---

## 6. Generate Traffic for Grafana

```bash
# Generate 5 batches × 12 requests (60 total) against the gateway
node scripts/traffic-generator.js http://localhost:3000 5

# Or against the Kubernetes NodePort
node scripts/traffic-generator.js http://localhost:30080 5
```

---

## 7. CI/CD Pipeline (GitHub Actions)

File: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

| Stage | Trigger | Action |
|-------|---------|--------|
| **Test** | Every push & PR | `npm test` in all 4 services (Node built-in test runner) |
| **Validate K8s** | Every push & PR | `kubectl apply --dry-run=client -f k8s/` |
| **Build & Push** | Push to main only | Docker build → push to GHCR (`ghcr.io/jagratjani/campusconnect-*`) |

---

## 8. Running Tests Locally

```bash
# All services
npm test

# Individual service
npm run test:gateway
npm run test:user
npm run test:product
npm run test:order
```

---

## 9. API Reference (via Gateway at :3000 or :30080)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Gateway liveness + service registry |
| GET | `/metrics` | Prometheus metrics export |
| GET | `/users` | List all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create a new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/products` | List all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create a product |
| GET | `/orders` | List all orders |
| GET | `/orders/:id` | Get order by ID |
| POST | `/orders` | Create order (validates userId + productId via inter-service calls) |

---

## 10. Project Structure

```
Lab7_Api-Gateway/
├── api-gateway/           # Express API Gateway + Prometheus metrics
│   ├── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── test/gateway.test.js
├── user-service/          # User CRUD + /metrics endpoint
│   ├── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── test/user.test.js
├── product-service/       # Product CRUD + /metrics endpoint
│   ├── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── test/product.test.js
├── order-service/         # Orders + inter-service calls + /metrics endpoint
│   ├── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── test/order.test.js
├── k8s/                   # ← NEW: Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── gateway-deployment.yaml + gateway-service.yaml
│   ├── user-deployment.yaml + user-service.yaml
│   ├── product-deployment.yaml + product-service.yaml
│   ├── order-deployment.yaml + order-service.yaml
│   ├── prometheus-configmap.yaml
│   ├── prometheus-deployment.yaml + prometheus-service.yaml
│   ├── grafana-datasources-configmap.yaml
│   ├── grafana-dashboards-configmap.yaml
│   ├── grafana-deployment.yaml + grafana-service.yaml
│   └── secret.yaml        (gitignored — contains DB credentials)
├── scripts/
│   ├── traffic-generator.js   # ← NEW: Load generator for Prometheus/Grafana
│   └── generate-traffic.ps1
├── .github/workflows/ci.yml   # ← NEW: GitHub Actions CI/CD
├── compose.yaml           # Docker Compose (all 4 services)
├── render.yaml            # Render.com cloud deploy
└── package.json           # Root: runs all service tests
```

---

*Lab 8 — CampusConnect Microservices | Web Services & SOA | Jagrat Jani 202512119*

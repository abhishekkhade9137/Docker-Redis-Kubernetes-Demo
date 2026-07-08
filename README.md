# Cloud-Native Demo · Redis · Docker · Kubernetes

A clean, black-and-white themed full-stack demonstration showcasing the three pillars of modern cloud-native applications: **Redis caching**, **Docker containerisation**, and **Kubernetes deployment with autoscaling**.

## 🏗️ The Big Picture Architecture

```text
Your Browser
    │
    ▼
[cn_app container : port 3000]   ←──── Next.js App
    │
    │  REDIS_URL=redis://redis:6379
    ▼
[cn_redis container : port 6379] ←──── Redis 7
    │
    └── Persists to: redis_data volume
```

Both containers live on an internal network (`cn_net`). The Next.js application communicates with the Redis instance using the container hostname (`redis`), bypassing IP addresses entirely.

---

## ⚡ How it Works: Redis Caching

The core of the demo is the caching layer. When a user looks up a key (e.g., `product:42`), the system behaves as follows:

1. **API Request**: The browser hits `/api/cache?key=product:42`
2. **Cache Check**: The API queries Redis (`GET cache:product:42`).
   - **Cache HIT 🟢**: If the data exists, it is returned instantly (typically `< 5ms`).
   - **Cache MISS ⚪**: If the data is missing, the API simulates a database query (800ms delay), stores the result in Redis with a 30-second Time-To-Live (`SETEX cache:product:42 30 "data"`), and then returns it.

**Redis Operations Used:**
- `GET` / `SETEX` / `DEL` — Cache lookup, store with expiry, and cache invalidation (bust).
- `INCR` — Atomic visit counter (increments safely across multiple instances/pods).
- `INFO all` — Pulls raw Redis server metrics (memory, hits, misses, uptime) displayed on the dashboard.

---

## 🐳 How it Works: Docker Multi-Stage Build

The application is containerised using a highly optimized, multi-stage Dockerfile to minimize image size and maximize security.

| Stage | Purpose |
|---|---|
| `deps` | Installs only production dependencies (`npm ci --omit=dev`). |
| `builder` | Installs all dependencies and runs the Next.js build step (`next build`) to produce the standalone output. |
| `runner` | Copies only the required built assets into a clean, minimal Alpine Linux image. |

**Result:** A tiny final container image (~150MB) that contains no source code, development tools, or unnecessary overhead.

---

## ☸️ How it Works: Kubernetes

The repository includes a complete suite of Kubernetes manifests (`k8s/` folder) to deploy the app in a production-like, highly available environment.

| Manifest File | Role |
|---|---|
| `namespace.yaml` | Isolates all resources in a dedicated `cloud-native` namespace. |
| `redis-deployment.yaml` | Deploys a single Redis pod with persistent storage and a `ClusterIP` service (DNS: `redis`). |
| `app-deployment.yaml` | Deploys 3 replicas of the Next.js app with zero-downtime rolling updates and health probes. |
| `app-hpa.yaml` | Horizontal Pod Autoscaler (HPA) dynamically scales the app between 2 and 10 pods if CPU usage exceeds 60% or memory exceeds 70%. |
| `ingress.yaml` | An NGINX Ingress controller configuration to expose the app to the outside world (`cloud-native.local`). |

---

## 🚀 Getting Started

### Option 1: Docker Compose (Recommended)
This is the easiest way to run the entire stack locally. It builds the app image and starts Redis alongside it.

```bash
# Start the stack
docker compose up --build

# Stop the stack
docker compose down
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Option 2: Local Development (Faster iteration)
If you want to edit code and see changes instantly, run Redis in Docker and the Next.js app natively.

```bash
# Terminal 1 - Start Redis
docker run -d -p 6379:6379 --name cn_redis redis:7-alpine

# Terminal 2 - Start the Next.js app
cd app
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Option 3: Deploy to Kubernetes
To test the Kubernetes configuration on a local cluster (like Docker Desktop's built-in Kubernetes or minikube):

```bash
# 1. Build the Docker image locally
docker build -t cloud-native-app:latest ./app

# 2. Apply the Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-hpa.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify pods are running
kubectl get all -n cloud-native

# 4. Port-forward to access the app
kubectl port-forward svc/cloud-native-app 3000:80 -n cloud-native
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

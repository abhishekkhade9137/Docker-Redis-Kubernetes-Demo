# Cloud-Native Demo · Redis · Docker · Kubernetes

A focused full-stack demo showcasing Redis caching, Docker containerisation, and Kubernetes deployment.

## Quick Start — Local Dev (no Docker)

```bash
# 1. Start Redis (Docker required just for Redis)
docker run -d -p 6379:6379 --name redis redis:7-alpine

# 2. Install & run the app
cd app
npm install
npm run dev
# → http://localhost:3000
```

## Docker Compose (recommended)

```bash
docker compose up --build
# → http://localhost:3000
```

## Kubernetes Deployment

```bash
# 1. Build & push your image
docker build -t your-registry/cloud-native-app:latest ./app
docker push your-registry/cloud-native-app:latest

# 2. Update k8s/app-deployment.yaml image field, then:
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-hpa.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Check status
kubectl get all -n cloud-native
```

## Project Structure

```
├── app/                      # Next.js application
│   ├── src/
│   │   ├── lib/redis.ts      # Redis client singleton
│   │   └── app/
│   │       ├── page.tsx      # Main UI
│   │       └── api/
│   │           ├── cache/    # Cache hit/miss API
│   │           └── stats/    # Redis metrics API
│   └── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml        # Local full-stack
└── k8s/
    ├── namespace.yaml
    ├── redis-deployment.yaml # Redis pod + ClusterIP
    ├── app-deployment.yaml   # 3-replica app + ClusterIP
    ├── app-hpa.yaml          # Autoscale 2–10 pods
    └── ingress.yaml          # Nginx Ingress
```

## What the App Shows

| Feature | Detail |
|---|---|
| **Cache HIT** | Returns in <5ms from Redis |
| **Cache MISS** | Simulates 800ms DB query, then caches (30s TTL) |
| **Visit Counter** | Redis `INCR` across all instances |
| **Redis Metrics** | Memory, hits, misses, uptime, connected clients |
| **HPA** | Auto-scales 2→10 pods at 60% CPU |

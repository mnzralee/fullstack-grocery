# Kubernetes Manifests

Four files. That's all you need to run `svc-grocery` on a Kubernetes cluster.

## Files

| File | Kind | What it does |
|------|------|-------------|
| `configmap.yaml` | ConfigMap | Non-sensitive config: `NODE_ENV`, `PORT`, `DATABASE_URL` |
| `secret.yaml` | Secret | Sensitive values: `JWT_SECRET` (base64-encoded by K8s) |
| `deployment.yaml` | Deployment | 2 replicas, resource limits, liveness + readiness probes |
| `service.yaml` | Service | ClusterIP on port 80, forwards to container port 3060 |

## Deploy

```bash
kubectl apply -f k8s/
```

That creates the ConfigMap, Secret, Deployment, and Service in one command. Kubernetes reads them in dependency order automatically.

## What Each File Does

### configmap.yaml

```yaml
NODE_ENV: production
PORT: "3060"
DATABASE_URL: postgresql://user:pass@postgres:5432/grocery_db
```

Readable by anyone with namespace access. Never put secrets here.

### secret.yaml

```yaml
JWT_SECRET: change-me-in-production
```

Uses `stringData` for readability, Kubernetes base64-encodes it automatically. In production, use a secrets manager (Vault, AWS Secrets Manager, etc.) or sealed secrets. Never commit real secret values to git.

### deployment.yaml

- **2 replicas**: one pod can go down and traffic still flows
- **Resource limits**: 256Mi memory, 250m CPU (prevents a runaway pod from starving the node)
- **Liveness probe**: `GET /health` every 30s. Fails 3 times? Pod gets killed and restarted
- **Readiness probe**: `GET /health` every 10s. Fails? Pod is removed from the Service until it recovers
- **Environment** from ConfigMap + Secret via `envFrom`

### service.yaml

```yaml
type: ClusterIP
port: 80 → targetPort: 3060
```

Inside the cluster: `http://svc-grocery.grocery-dev:80`
Outside the cluster: needs an Ingress or port-forward.

## Local Testing with kubectl

```bash
# Port-forward to access from your machine
kubectl port-forward svc/svc-grocery 3060:80

# Health check
curl http://localhost:3060/health
```

## Production Checklist

- [ ] Replace `DATABASE_URL` with your production PostgreSQL connection string
- [ ] Set a strong `JWT_SECRET` (min 32 chars, random)
- [ ] Use a real secrets management solution (not `stringData` in a yaml file)
- [ ] Add an Ingress or LoadBalancer for external access
- [ ] Configure horizontal pod autoscaling if needed
- [ ] Set up monitoring (Prometheus) and logging (Loki/ELK)

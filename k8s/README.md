# Kubernetes Deployment for Move-In Application

This directory contains Kubernetes manifests for deploying the Move-In application securely with proper credential management.

## Architecture Overview

The deployment consists of:
- **Secrets**: Secure storage of Supabase credentials and database connection strings
- **ConfigMap**: Non-sensitive configuration values
- **Deployment**: Application pods with security controls and health checks
- **Service**: Load balancing and service discovery
- **HPA**: Automatic scaling based on resource utilization

## Security Features

### Credential Management
- Sensitive credentials are stored in Kubernetes Secrets (base64 encoded at rest)
- Environment variables are injected at runtime from secrets
- No credentials are baked into the Docker image
- Secrets are never committed to version control

### Container Security
- Runs as non-root user (UID 1000)
- Drops all capabilities
- Prevents privilege escalation
- Resource limits to prevent resource exhaustion

### Network Security
- ClusterIP service type (internal cluster access by default)
- Optional ingress configuration for external access
- Health checks for proper container lifecycle management

## Deployment Instructions

### 1. Prerequisites

Ensure you have:
- Kubernetes cluster access with `kubectl` configured
- Supabase project with credentials
- Docker image built and pushed to `ghcr.io/vladafanasev/move-in:main`

### 2. Create Secrets

**IMPORTANT**: Never commit actual secrets to version control!

```bash
# Create a copy of the secrets template
cp k8s/secrets.template.yaml k8s/secrets.yaml

# Add secrets.yaml to .gitignore if not already present
echo "k8s/secrets.yaml" >> .gitignore
```

Fill in the actual values in `k8s/secrets.yaml`. You need to base64 encode your values:

```bash
# Base64 encode your Supabase URL
echo -n "https://your-project.supabase.co" | base64

# Base64 encode your Supabase anonymous key
echo -n "your_supabase_anon_key" | base64

# Base64 encode your database URL
echo -n "postgresql://postgres:password@host:5432/postgres" | base64
```

### 3. Deploy to Kubernetes

Apply the manifests in order:

```bash
# Apply secrets and config (do this first)
kubectl apply -f k8s/secrets.yaml

# Apply the application deployment
kubectl apply -f k8s/deployment.yaml

# Apply the service and optional HPA
kubectl apply -f k8s/service.yaml
```

### 4. Verify Deployment

```bash
# Check deployment status
kubectl get deployments
kubectl get pods -l app=move-in

# Check if secrets are properly mounted
kubectl describe pod -l app=move-in

# View logs
kubectl logs -l app=move-in -f

# Check service
kubectl get services
```

### 5. Access the Application

By default, the service is of type `ClusterIP` (internal only). To access externally:

#### Option A: Port Forward (Development/Testing)
```bash
kubectl port-forward service/move-in-service 8080:80
# Access at http://localhost:8080
```

#### Option B: Configure Ingress (Production)
Uncomment and configure the ingress section in `service.yaml` based on your ingress controller:

```bash
# Edit service.yaml to uncomment and configure ingress
kubectl apply -f k8s/service.yaml
```

## Configuration Management

### Environment Variables

The application uses these environment variables:

**From Secrets** (sensitive):
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key  
- `DATABASE_URL`: PostgreSQL connection string

**From ConfigMap** (non-sensitive):
- `NODE_ENV`: Production environment
- `NEXT_TELEMETRY_DISABLED`: Disable Next.js telemetry
- `PORT`: Application port (3000)
- `HOSTNAME`: Bind hostname (0.0.0.0)

### Updating Configuration

To update non-sensitive configuration:
```bash
kubectl edit configmap move-in-config
kubectl rollout restart deployment/move-in-app
```

To update secrets:
```bash
# Edit your local secrets.yaml file
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart deployment/move-in-app
```

## Scaling

### Manual Scaling
```bash
kubectl scale deployment move-in-app --replicas=5
```

### Automatic Scaling
The HPA (Horizontal Pod Autoscaler) automatically scales between 2-10 replicas based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

Monitor scaling:
```bash
kubectl get hpa
kubectl describe hpa move-in-hpa
```

## Monitoring and Troubleshooting

### Health Checks
The deployment includes:
- **Liveness probe**: Restarts unhealthy containers
- **Readiness probe**: Removes unhealthy pods from service

### Logs
```bash
# View application logs
kubectl logs -l app=move-in -f

# View logs from a specific pod
kubectl logs <pod-name> -f

# View previous container logs (if pod restarted)
kubectl logs <pod-name> --previous
```

### Common Issues

#### Application Won't Start
1. Check if secrets are properly configured:
   ```bash
   kubectl get secrets move-in-secrets -o yaml
   ```

2. Verify environment variables are injected:
   ```bash
   kubectl exec -it <pod-name> -- env | grep SUPABASE
   ```

3. Check application logs for errors:
   ```bash
   kubectl logs <pod-name>
   ```

#### Can't Access Application
1. Verify service is running:
   ```bash
   kubectl get services
   kubectl describe service move-in-service
   ```

2. Check if pods are ready:
   ```bash
   kubectl get pods -l app=move-in
   ```

3. Test internal connectivity:
   ```bash
   kubectl run test-pod --image=curlimages/curl:latest --rm -it --restart=Never -- curl move-in-service
   ```

## Security Best Practices

### Secrets Management
- Store secrets in external secret management systems (e.g., HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets regularly
- Use least-privilege access for service accounts
- Monitor secret access with audit logs

### Image Security
- Regularly update base images for security patches
- Scan images for vulnerabilities before deployment
- Use specific image tags instead of `latest`

### Network Security
- Implement network policies to restrict pod-to-pod communication
- Use ingress controllers with TLS termination
- Consider service mesh for advanced traffic management

### Resource Management
- Set appropriate resource requests and limits
- Monitor resource usage and adjust as needed
- Use PodDisruptionBudgets for high availability

## CI/CD Integration

The deployment is designed to work with your existing GitHub Actions pipeline:

1. GitHub Actions builds and pushes to `ghcr.io/vladafanasev/move-in:main`
2. Update the deployment to use the new image:
   ```bash
   kubectl rollout restart deployment/move-in-app
   ```
3. Monitor rollout status:
   ```bash
   kubectl rollout status deployment/move-in-app
   ```

For automated deployments, consider using GitOps tools like ArgoCD or Flux.
# 🚀 GitHub Actions Auto-Deploy Implementation Plan

## Overview
Implement automatic deployment to Kubernetes using GitHub Actions where:
- **Development Team**: Manages secrets via GitHub repository settings (no sharing required)
- **Infrastructure Team**: Provides Kubernetes access, never handles application secrets
- **Pipeline**: Automatically builds Docker image and deploys to Kubernetes on every merge to `main`

## 📋 Implementation Steps

### Phase 1: Development Team Setup (You)

#### Step 1.1: Add Secrets to GitHub Repository
1. Go to your GitHub repository: `https://github.com/vladafanasev/move-in`
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://olfblnwhinkfjazbwbyz.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Your Supabase anonymous key |
| `DATABASE_URL` | `postgresql://postgres.olfblnwhinkfjazbwbyz:...` | Your Supabase database connection |

#### Step 1.2: Prepare Deployment Files
- ✅ GitHub Actions workflow already created: `.github/workflows/deploy.yml`
- ✅ Kubernetes manifests ready in `k8s/` directory
- ✅ Docker configuration supports runtime environment variables

#### Step 1.3: Wait for Infrastructure Team Setup
- Wait for infra team to provide `KUBE_CONFIG` secret (Step 2.2)

### Phase 2: Infrastructure Team Setup

#### Step 2.1: Prepare Kubernetes Cluster
```bash
# Create namespace for the application
kubectl create namespace move-in

# Verify cluster is ready
kubectl get nodes
kubectl get namespaces
```

#### Step 2.2: Generate Kubeconfig for GitHub Actions
```bash
# Create service account for GitHub Actions
kubectl create serviceaccount github-actions -n move-in

# Create role with necessary permissions
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: move-in
  name: github-actions-role
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps", "services", "pods"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
EOF

# Bind role to service account
kubectl create rolebinding github-actions-binding \
  --role=github-actions-role \
  --serviceaccount=move-in:github-actions \
  -n move-in

# Generate kubeconfig for the service account
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: github-actions-token
  namespace: move-in
  annotations:
    kubernetes.io/service-account.name: github-actions
type: kubernetes.io/service-account-token
EOF

# Extract kubeconfig (replace YOUR_CLUSTER_ENDPOINT with actual endpoint)
kubectl get secret github-actions-token -n move-in -o jsonpath='{.data.token}' | base64 -d > /tmp/token
kubectl config view --raw > /tmp/kubeconfig-template

# Create kubeconfig for GitHub Actions
cat > /tmp/github-actions-kubeconfig << EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: YOUR_CLUSTER_ENDPOINT  # Replace with your cluster endpoint
    certificate-authority-data: $(kubectl get secret github-actions-token -n move-in -o jsonpath='{.data.ca\.crt}')
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    namespace: move-in
    user: github-actions
  name: github-actions@kubernetes
current-context: github-actions@kubernetes
users:
- name: github-actions
  user:
    token: $(cat /tmp/token)
EOF

# Base64 encode the kubeconfig for GitHub Secrets
base64 -w 0 /tmp/github-actions-kubeconfig > /tmp/kubeconfig-base64
echo "Add this value to GitHub Secrets as KUBE_CONFIG:"
cat /tmp/kubeconfig-base64
```

#### Step 2.3: Provide Kubeconfig to Development Team
- Share the base64-encoded kubeconfig (output from Step 2.2)
- Development team adds this as `KUBE_CONFIG` secret in GitHub repository

### Phase 3: Development Team Final Setup (You)

#### Step 3.1: Add Kubeconfig Secret
1. Go to GitHub repository: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `KUBE_CONFIG`
4. Value: The base64-encoded string provided by infrastructure team

#### Step 3.2: Test the Pipeline
1. Make a small change to your code
2. Commit and push to `main` branch
3. Go to **Actions** tab in GitHub to watch the deployment
4. Pipeline should:
   - ✅ Build and push Docker image
   - ✅ Deploy to Kubernetes with your secrets
   - ✅ Show successful deployment

## 🔄 How It Works After Setup

### Every Merge to Main:
1. **GitHub Actions triggers** automatically
2. **Builds Docker image** with latest code
3. **Pushes to** `ghcr.io/vladafanasev/move-in:latest`
4. **Creates Kubernetes secrets** from your GitHub repository secrets
5. **Deploys to Kubernetes** using infra team's cluster
6. **Application runs** with your secrets injected as environment variables

### Security Benefits:
- ✅ **No secret sharing** between teams
- ✅ **Secrets encrypted** in GitHub and Kubernetes
- ✅ **Automatic deployment** reduces manual errors
- ✅ **Audit trail** of all deployments in GitHub Actions
- ✅ **Role-based access** limits what GitHub Actions can do

## 🧪 Testing & Validation

### Development Team Tests:
```bash
# After deployment, check if app is running
kubectl get pods -n move-in
kubectl logs deployment/move-in-app -n move-in

# Test if secrets are properly injected
kubectl exec deployment/move-in-app -n move-in -- env | grep SUPABASE
```

### Infrastructure Team Tests:
```bash
# Verify deployment is healthy
kubectl get all -n move-in
kubectl describe deployment/move-in-app -n move-in

# Check if secrets were created properly
kubectl get secrets -n move-in
```

## 🆘 Troubleshooting

### Common Issues:

**GitHub Actions fails with "connection refused"**
- Check if `KUBE_CONFIG` secret is properly set
- Verify kubeconfig has correct cluster endpoint

**Pods fail to start**
- Check if secrets are properly created: `kubectl get secrets -n move-in`
- Verify environment variables: `kubectl describe pod -n move-in`

**Database connection fails**
- Ensure `DATABASE_URL` secret is correctly formatted
- Check if Supabase credentials are valid

## 🎯 Success Criteria

- [ ] Development team can merge to `main` without touching Kubernetes
- [ ] Infrastructure team never sees application secrets
- [ ] Application automatically deploys with correct environment variables
- [ ] Database connectivity works in Kubernetes
- [ ] Both teams can monitor deployment status

## 📞 Team Communication

### Development Team → Infrastructure Team:
- "Please provide base64-encoded kubeconfig for GitHub Actions"
- "Deployment failed, can you check cluster logs?"

### Infrastructure Team → Development Team:
- "Kubeconfig ready, add as KUBE_CONFIG secret"
- "Cluster maintenance window: [date/time]"

---

**Next Step**: Infrastructure team executes Phase 2, then development team completes Phase 3! 🚀
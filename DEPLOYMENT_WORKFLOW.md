# 🚀 Move-In App Deployment Workflow

## Overview
This document outlines the complete deployment workflow for the Move-In application using GitHub Actions to automatically deploy to multiple Kubernetes clusters without sharing secrets between teams.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Frontend Team   │    │ GitHub Actions   │    │ Infrastructure  │
│ (You)          │    │ Pipeline         │    │ Team            │
│                │    │                  │    │                 │
│ • Manages code │────▶│ • Builds image   │────▶│ • Provides      │
│ • Stores secrets│    │ • Deploys auto   │    │   cluster access│
│ • No K8s access│    │ • Uses secrets   │    │ • No app secrets│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎯 Deployment Flow

### Every merge to `main` branch:

1. **Code Push** → GitHub repository
2. **GitHub Actions Triggers** automatically
3. **Docker Image Built** with latest code
4. **Image Pushed** to `ghcr.io/vladafanasev/move-in`
5. **Secrets Injected** from GitHub repository secrets
6. **Deployed to Both Clusters**:
   - 🏢 On-premise cluster (if `KUBE_CONFIG_ONPREM` exists)
   - ☁️ Virtual cluster (if `KUBE_CONFIG_VIRTUAL` exists)
7. **Application Running** with Supabase connectivity

---

# 👨‍💻 Frontend Team Responsibilities

## Phase 1: Setup GitHub Repository Secrets

### Step 1: Navigate to Repository Secrets
1. Go to your GitHub repository: `https://github.com/vladafanasev/move-in`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Application Secrets
Add these 3 secrets with your actual Supabase values:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://olfblnwhinkfjazbwbyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `DATABASE_URL` | Your Supabase database connection | `postgresql://postgres.olf...` |

### Step 3: Request Cluster Access from Infrastructure Team
Send this message to your infrastructure team:

```
Hi Infrastructure Team!

I need kubeconfig access for GitHub Actions auto-deployment.

Please provide base64-encoded kubeconfig files:
- On-premise team member: Send me KUBE_CONFIG_ONPREM
- Virtual cluster team member: Send me KUBE_CONFIG_VIRTUAL

Requirements:
• Service account with deployment permissions in 'move-in' namespace
• Permissions: create/update secrets, deployments, services, pods
• Base64-encoded format
• Follow steps in DEPLOYMENT_WORKFLOW.md (Infrastructure section)

Thanks!
```

### Step 4: Add Cluster Access Secrets
When infrastructure team provides kubeconfig files, add them as:

| Secret Name | Value | Who Provides |
|-------------|-------|--------------|
| `KUBE_CONFIG_ONPREM` | Base64-encoded kubeconfig | On-premise infra member |
| `KUBE_CONFIG_VIRTUAL` | Base64-encoded kubeconfig | Virtual cluster infra member |

### Step 5: Test Deployment
1. Make a small change to your code (e.g., add a comment)
2. Commit and push to `main` branch
3. Go to **Actions** tab in GitHub
4. Watch the deployment pipeline run
5. Verify both clusters receive the deployment

## Frontend Team Checklist
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` secret
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` secret  
- [ ] Added `DATABASE_URL` secret
- [ ] Requested kubeconfig from infrastructure team
- [ ] Added `KUBE_CONFIG_ONPREM` secret
- [ ] Added `KUBE_CONFIG_VIRTUAL` secret
- [ ] Tested deployment by merging to main
- [ ] Verified app is accessible on both clusters

---

# 🏗️ Infrastructure Team Responsibilities

## Phase 1: Prepare Kubernetes Clusters

### Step 1: Verify Cluster Readiness
```bash
# For each cluster (on-premise and virtual)
kubectl get nodes
kubectl get namespaces
```

### Step 2: Create Application Namespace
```bash
# Create namespace for the Move-In application
kubectl create namespace move-in
```

## Phase 2: Generate GitHub Actions Access

### Step 3: Create Service Account
```bash
# Create service account for GitHub Actions
kubectl create serviceaccount github-actions -n move-in
```

### Step 4: Create Role with Required Permissions
```bash
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: move-in
  name: github-actions-role
rules:
# Secrets management
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
# ConfigMaps management  
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
# Services management
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
# Pods access (for logs and status)
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
# Deployments management
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "create", "update", "patch", "delete"]
# ReplicaSets access (for rollout status)
- apiGroups: ["apps"]
  resources: ["replicasets"]
  verbs: ["get", "list"]
EOF
```

### Step 5: Bind Role to Service Account
```bash
kubectl create rolebinding github-actions-binding \
  --role=github-actions-role \
  --serviceaccount=move-in:github-actions \
  -n move-in
```

### Step 6: Generate Service Account Token
```bash
# Create token secret for service account
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
```

### Step 7: Extract Cluster Information
```bash
# Get cluster server endpoint
CLUSTER_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
echo "Cluster Server: $CLUSTER_SERVER"

# Get cluster certificate
CLUSTER_CERT=$(kubectl get secret github-actions-token -n move-in -o jsonpath='{.data.ca\.crt}')

# Get service account token
SA_TOKEN=$(kubectl get secret github-actions-token -n move-in -o jsonpath='{.data.token}' | base64 -d)
```

### Step 8: Generate Kubeconfig for GitHub Actions
```bash
# Create kubeconfig file
cat > github-actions-kubeconfig.yaml << EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: $CLUSTER_SERVER
    certificate-authority-data: $CLUSTER_CERT
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
    token: $SA_TOKEN
EOF
```

### Step 9: Base64 Encode for GitHub Secrets
```bash
# Encode kubeconfig for GitHub Secrets
base64 -w 0 github-actions-kubeconfig.yaml > kubeconfig-base64.txt

echo "================================================"
echo "PROVIDE THIS TO FRONTEND TEAM:"
echo "================================================"
if [[ "$CLUSTER_TYPE" == "onprem" ]]; then
    echo "Secret Name: KUBE_CONFIG_ONPREM"
else
    echo "Secret Name: KUBE_CONFIG_VIRTUAL"
fi
echo "Secret Value:"
cat kubeconfig-base64.txt
echo ""
echo "================================================"

# Clean up sensitive files
rm github-actions-kubeconfig.yaml
rm kubeconfig-base64.txt
```

## Infrastructure Team Checklist

### For Each Cluster (On-premise and Virtual):
- [ ] Verified cluster is accessible with kubectl
- [ ] Created `move-in` namespace
- [ ] Created `github-actions` service account
- [ ] Applied RBAC role and role binding
- [ ] Generated service account token
- [ ] Created base64-encoded kubeconfig
- [ ] Shared kubeconfig with frontend team
- [ ] Verified frontend team can deploy successfully

---

# 🔍 Monitoring & Troubleshooting

## Checking Deployment Status

### Frontend Team:
```bash
# Check GitHub Actions logs
# Go to: https://github.com/vladafanasev/move-in/actions

# Check if secrets are properly set
# Go to: Settings → Secrets and variables → Actions
```

### Infrastructure Team:
```bash
# Check deployment status
kubectl get all -n move-in

# Check pods and their logs
kubectl get pods -n move-in
kubectl logs deployment/move-in-app -n move-in

# Check if secrets were created
kubectl get secrets -n move-in
kubectl describe secret move-in-secrets -n move-in

# Check deployment events
kubectl describe deployment/move-in-app -n move-in
```

## Common Issues & Solutions

### ❌ "connection refused" in GitHub Actions
**Problem**: GitHub Actions can't connect to Kubernetes cluster  
**Solution**: 
- Infrastructure team: Verify kubeconfig has correct server endpoint
- Frontend team: Check `KUBE_CONFIG_*` secret is properly set

### ❌ "forbidden" errors in deployment  
**Problem**: Service account lacks permissions  
**Solution**: Infrastructure team re-apply RBAC rules (Steps 4-5)

### ❌ Database connection fails
**Problem**: App can't connect to Supabase  
**Solution**: Frontend team verify `DATABASE_URL` secret format

### ❌ Pods stuck in "Pending" state
**Problem**: Resource constraints or scheduling issues  
**Solution**: Infrastructure team check cluster resources and node status

---

# 🎯 Success Criteria

## When Everything Works:
- ✅ Frontend team can merge to `main` without touching Kubernetes
- ✅ Infrastructure teams never see application secrets  
- ✅ Application automatically deploys to both clusters
- ✅ Database connectivity works in both environments
- ✅ Both teams can monitor deployment status independently
- ✅ Zero manual deployment steps required

## Expected Results:
1. **Merge to main** triggers automatic deployment
2. **Docker image** built and pushed to `ghcr.io/vladafanasev/move-in`
3. **Both clusters** receive identical deployments
4. **Application accessible** via Kubernetes services
5. **Supabase connectivity** working in both environments

---

# 🔐 Security Benefits

## Secrets Isolation:
- 🔒 **Frontend secrets** stored in GitHub (encrypted)
- 🔒 **Cluster access** managed by infrastructure team
- 🔒 **No secret sharing** between teams
- 🔒 **Audit trail** of all deployments
- 🔒 **Limited permissions** for GitHub Actions
- 🔒 **Revokable access** (infrastructure can disable anytime)

## Team Separation:
- 👨‍💻 **Frontend team**: Focuses on application code and secrets
- 🏗️ **Infrastructure team**: Manages cluster access and resources
- 🤖 **GitHub Actions**: Bridges teams without compromising security

---

This workflow ensures secure, automated deployment while maintaining clear separation of responsibilities between frontend and infrastructure teams.
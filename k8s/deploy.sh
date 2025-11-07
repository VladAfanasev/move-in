#!/bin/bash

# Move-In Kubernetes Deployment Script
# This script helps deploy the application securely to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="default"
SECRET_FILE="k8s/secrets.yaml"
SECRET_TEMPLATE="k8s/secrets.template.yaml"

# Helper functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        error "kubectl is not connected to a cluster"
    fi
    
    log "Connected to cluster: $(kubectl config current-context)"
}

# Check if secrets file exists
check_secrets() {
    if [[ ! -f "$SECRET_FILE" ]]; then
        warn "Secrets file not found: $SECRET_FILE"
        
        if [[ -f "$SECRET_TEMPLATE" ]]; then
            log "Creating secrets file from template..."
            cp "$SECRET_TEMPLATE" "$SECRET_FILE"
            error "Please edit $SECRET_FILE with your actual credentials and run again"
        else
            error "Neither secrets file nor template found"
        fi
    fi
    
    # Check if secrets file contains placeholder values
    if grep -q "<BASE64_ENCODED_" "$SECRET_FILE"; then
        error "Secrets file contains placeholder values. Please edit $SECRET_FILE with your actual credentials"
    fi
    
    success "Secrets file validation passed"
}

# Deploy function
deploy() {
    log "Starting deployment..."
    
    # Apply secrets first
    log "Applying secrets..."
    kubectl apply -f "$SECRET_FILE"
    
    # Apply config map
    log "Applying configuration..."
    kubectl apply -f k8s/secrets.template.yaml  # Contains the ConfigMap
    
    # Apply deployment
    log "Applying deployment..."
    kubectl apply -f k8s/deployment.yaml
    
    # Apply service
    log "Applying service..."
    kubectl apply -f k8s/service.yaml
    
    success "Deployment manifests applied successfully"
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    kubectl rollout status deployment/move-in-app --timeout=300s
    
    # Show status
    show_status
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    kubectl get deployments -l app=move-in
    
    log "Pods:"
    kubectl get pods -l app=move-in
    
    log "Services:"
    kubectl get services -l app=move-in
    
    log "HPA (if enabled):"
    kubectl get hpa move-in-hpa 2>/dev/null || echo "HPA not found"
}

# Setup function for first-time deployment
setup() {
    log "Setting up secrets file..."
    
    if [[ ! -f "$SECRET_FILE" ]]; then
        if [[ -f "$SECRET_TEMPLATE" ]]; then
            cp "$SECRET_TEMPLATE" "$SECRET_FILE"
            log "Created $SECRET_FILE from template"
        else
            error "Template file not found: $SECRET_TEMPLATE"
        fi
    else
        warn "Secrets file already exists: $SECRET_FILE"
    fi
    
    # Add to gitignore
    if [[ ! -f .gitignore ]]; then
        echo "k8s/secrets.yaml" > .gitignore
        log "Created .gitignore file"
    elif ! grep -q "k8s/secrets.yaml" .gitignore; then
        echo "k8s/secrets.yaml" >> .gitignore
        log "Added k8s/secrets.yaml to .gitignore"
    fi
    
    warn "Next steps:"
    echo "1. Get your Supabase credentials from https://supabase.com/dashboard"
    echo "2. Base64 encode your credentials:"
    echo "   echo -n 'https://your-project.supabase.co' | base64"
    echo "   echo -n 'your_supabase_anon_key' | base64"
    echo "   echo -n 'postgresql://...' | base64"
    echo "3. Edit $SECRET_FILE with the encoded values"
    echo "4. Run: $0 deploy"
}

# Clean up function
cleanup() {
    warn "This will delete all Move-In resources from the cluster"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Deleting resources..."
        kubectl delete -f k8s/service.yaml --ignore-not-found=true
        kubectl delete -f k8s/deployment.yaml --ignore-not-found=true
        kubectl delete -f "$SECRET_FILE" --ignore-not-found=true
        
        success "Resources deleted successfully"
    else
        log "Cleanup cancelled"
    fi
}

# Port forward for local access
port_forward() {
    local port=${1:-8080}
    log "Starting port forward to localhost:$port"
    log "Access the application at: http://localhost:$port"
    log "Press Ctrl+C to stop"
    
    kubectl port-forward service/move-in-service "$port:80"
}

# Main script logic
case "${1:-}" in
    "setup")
        setup
        ;;
    "deploy")
        check_kubectl
        check_secrets
        deploy
        ;;
    "status")
        check_kubectl
        show_status
        ;;
    "cleanup")
        check_kubectl
        cleanup
        ;;
    "port-forward")
        check_kubectl
        port_forward "${2:-8080}"
        ;;
    "logs")
        check_kubectl
        kubectl logs -l app=move-in -f
        ;;
    *)
        echo "Move-In Kubernetes Deployment Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  setup         Create secrets file and setup gitignore"
        echo "  deploy        Deploy application to Kubernetes"
        echo "  status        Show deployment status"
        echo "  cleanup       Remove all resources from cluster"
        echo "  port-forward  Forward service to localhost (default port: 8080)"
        echo "  logs          Show application logs"
        echo ""
        echo "Examples:"
        echo "  $0 setup                    # First-time setup"
        echo "  $0 deploy                   # Deploy application"
        echo "  $0 port-forward 3000        # Access app at localhost:3000"
        echo "  $0 logs                     # View application logs"
        ;;
esac
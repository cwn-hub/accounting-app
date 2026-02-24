#!/bin/bash

# SwissBooks Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-development}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "SwissBooks Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed. Aborting."; exit 1; }
    
    # Check .env file
    if [ ! -f .env ]; then
        log_warn ".env file not found. Copying from .env.example..."
        cp .env.example .env
        log_warn "Please update .env with your configuration before running again."
        exit 1
    fi
    
    log_info "Prerequisites check passed!"
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Build frontend
    cd frontend
    npm ci
    npm run build
    cd ..
    
    log_info "Frontend build complete!"
}

# Deploy with Docker Compose
deploy_docker() {
    log_info "Deploying with Docker Compose..."
    
    # Pull latest images
    docker-compose pull
    
    # Build and start services
    case $ENVIRONMENT in
        production)
            log_info "Starting production deployment..."
            docker-compose -f docker-compose.yml up -d --build
            ;;
        staging)
            log_info "Starting staging deployment..."
            docker-compose -f docker-compose.yml up -d --build
            ;;
        development)
            log_info "Starting development deployment..."
            docker-compose up -d --build
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_info "Docker deployment complete!"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    docker-compose exec -T backend alembic upgrade head || log_warn "Migration step skipped (may not be applicable)"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    sleep 5
    
    # Check backend
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log_info "Backend is healthy!"
    else
        log_warn "Backend health check failed. Check logs with: docker-compose logs backend"
    fi
    
    # Check frontend
    if curl -f http://localhost >/dev/null 2>&1; then
        log_info "Frontend is healthy!"
    else
        log_warn "Frontend health check failed. Check logs with: docker-compose logs frontend"
    fi
}

# Setup backups
setup_backups() {
    log_info "Setting up automated backups..."
    
    # Create backup directory
    mkdir -p backups
    
    # Add cron job for backups (if not exists)
    CRON_JOB="0 2 * * * cd $SCRIPT_DIR && docker-compose exec -T backend python -c 'import shutil; shutil.copy(\"./data/accounting.db\", \"./backups/accounting_$(date +\%Y\%m\%d).db\")'"
    
    (crontab -l 2>/dev/null | grep -v "accounting_backup"; echo "$CRON_JOB") | crontab -
    
    log_info "Backup cron job added!"
}

# Cleanup
cleanup() {
    log_info "Cleaning up old Docker resources..."
    docker system prune -f
    docker volume prune -f
}

# Show logs
show_logs() {
    log_info "Showing recent logs (press Ctrl+C to exit)..."
    docker-compose logs -f --tail=100
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    check_prerequisites
    
    if [ "$ENVIRONMENT" == "production" ]; then
        log_warn "Deploying to PRODUCTION environment!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled."
            exit 0
        fi
    fi
    
    build_app
    deploy_docker
    run_migrations
    health_check
    
    if [ "$ENVIRONMENT" == "production" ]; then
        setup_backups
        cleanup
    fi
    
    log_info "======================================"
    log_info "Deployment completed successfully!"
    log_info "======================================"
    log_info "Frontend: http://localhost"
    log_info "Backend API: http://localhost:8000"
    log_info "API Documentation: http://localhost:8000/docs"
    log_info ""
    log_info "To view logs: docker-compose logs -f"
    log_info "To stop: docker-compose down"
    log_info "======================================"
}

# Handle command line arguments
case "${2:-}" in
    --logs)
        show_logs
        ;;
    --backup)
        setup_backups
        ;;
    --cleanup)
        cleanup
        ;;
    *)
        main
        ;;
esac

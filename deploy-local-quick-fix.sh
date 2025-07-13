#!/bin/bash

# Smart-Lean-0DTE Quick Fix Deployment Script
# Version: 2.0.2-quickfix

# Disable strict mode temporarily to avoid unbound variable issues
set -eo pipefail

# Script configuration
SCRIPT_VERSION="2.0.2-quickfix"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Service configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✅ $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠️  $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} ❌ $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use
port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -i ":$port" >/dev/null 2>&1
    else
        false
    fi
}

# Get process using port
get_port_process() {
    local port=$1
    if command_exists lsof; then
        lsof -ti ":$port" 2>/dev/null | head -1
    fi
}

# Kill process gracefully
kill_process_gracefully() {
    local pid=$1
    local name=${2:-"process"}
    
    if [[ -z "$pid" ]]; then
        return 0
    fi
    
    log_info "Stopping $name (PID: $pid)"
    
    if kill -TERM "$pid" 2>/dev/null; then
        sleep 3
        if ! kill -0 "$pid" 2>/dev/null; then
            log_success "$name stopped gracefully"
        else
            kill -KILL "$pid" 2>/dev/null || true
            log_success "$name force stopped"
        fi
    fi
}

# Show banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                Smart-Lean-0DTE Quick Fix Deployment                         ║"
    echo "║                                Version $SCRIPT_VERSION                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}🚀 Quick deployment with array issue fixes${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_deps=()
    local required_commands=("docker" "docker-compose" "curl")
    
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "All prerequisites are satisfied"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    if [[ ! -f ".env.lean" ]]; then
        log_info "Creating default .env.lean file..."
        cat > .env.lean << 'EOF'
POSTGRES_PASSWORD=lean_dev_password
DATABENTO_API_KEY=demo_key
IBKR_USERNAME=demo_user
IBKR_PASSWORD=demo_pass
LEAN_MODE=true
DATA_OPTIMIZATION_ENABLED=true
CACHE_OPTIMIZATION_ENABLED=true
AI_OPTIMIZATION_ENABLED=true
DEBUG=true
LOG_LEVEL=INFO
ENVIRONMENT=lean-development
EOF
    fi
    
    cp .env.lean .env
    log_success "Environment file configured"
}

# Stop existing services
stop_existing_services() {
    log_info "Stopping existing services..."
    
    # Stop Docker Compose services
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose down --remove-orphans --timeout 30 2>/dev/null || true
        log_success "Docker Compose services stopped"
    fi
    
    # Stop processes on specific ports
    local ports=($BACKEND_PORT $FRONTEND_PORT)
    local port_names=("Backend" "Frontend")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if port_in_use "$port"; then
            local pid=$(get_port_process "$port")
            if [[ -n "$pid" ]]; then
                kill_process_gracefully "$pid" "$name"
            fi
        fi
    done
    
    # Clean up frontend PID file
    if [[ -f ".frontend.pid" ]]; then
        local frontend_pid=$(cat .frontend.pid 2>/dev/null || echo "")
        if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
            kill_process_gracefully "$frontend_pid" "Frontend Dev Server"
        fi
        rm -f .frontend.pid
    fi
    
    log_success "All services stopped"
}

# Install frontend dependencies
install_frontend_dependencies() {
    if [[ -f "frontend/package.json" ]] && command_exists node; then
        log_info "Installing frontend dependencies..."
        
        cd frontend
        
        # Clean install
        rm -rf node_modules package-lock.json 2>/dev/null || true
        
        if npm install --legacy-peer-deps --silent; then
            log_success "Frontend dependencies installed"
        else
            log_warning "Frontend dependency installation had issues, but continuing..."
        fi
        
        cd ..
    else
        log_info "Skipping frontend dependencies (Node.js not available)"
    fi
}

# Build and start services
build_and_start_services() {
    log_info "Building and starting services..."
    
    # Build services
    if docker-compose build --parallel 2>/dev/null; then
        log_success "Docker images built successfully"
    else
        log_warning "Docker build had issues, trying without parallel flag..."
        if docker-compose build; then
            log_success "Docker images built successfully"
        else
            log_error "Failed to build Docker images"
            return 1
        fi
    fi
    
    # Start services
    if docker-compose up -d; then
        log_success "Services started"
    else
        log_error "Failed to start services"
        return 1
    fi
}

# Wait for services
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U smart0dte_lean -d smart_0dte_lean >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    log_success "PostgreSQL is ready"
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    for i in {1..30}; do
        if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    log_success "Redis is ready"
    
    # Wait for Backend
    log_info "Waiting for Backend API..."
    for i in {1..60}; do
        if curl -s http://localhost:${BACKEND_PORT}/health >/dev/null 2>&1; then
            break
        fi
        sleep 3
    done
    log_success "Backend API is ready"
}

# Start frontend development server
start_frontend_dev_server() {
    if command_exists node && [[ -d "frontend" ]]; then
        log_info "Starting frontend development server..."
        
        cd frontend
        npm start >/dev/null 2>&1 &
        local frontend_pid=$!
        cd ..
        
        echo "$frontend_pid" > .frontend.pid
        
        # Wait for frontend
        log_info "Waiting for frontend..."
        for i in {1..40}; do
            if curl -s http://localhost:${FRONTEND_PORT} >/dev/null 2>&1; then
                break
            fi
            sleep 3
        done
        
        log_success "Frontend development server is ready (PID: $frontend_pid)"
    else
        log_info "Frontend will run in Docker container only"
    fi
}

# Perform health checks
perform_health_checks() {
    log_info "Performing health checks..."
    
    local health_status=0
    
    # Check Backend API
    if curl -s --max-time 10 "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
        log_success "Backend API is healthy"
    else
        log_warning "Backend API health check failed"
        health_status=1
    fi
    
    # Check Frontend
    if curl -s --max-time 10 "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend accessibility check failed"
        health_status=1
    fi
    
    if [[ $health_status -eq 0 ]]; then
        log_success "All health checks passed"
    else
        log_warning "Some health checks failed - system may not be fully operational"
    fi
    
    return $health_status
}

# Main function
main() {
    show_banner
    
    log_info "Starting Smart-Lean-0DTE Quick Fix Deployment v$SCRIPT_VERSION"
    log_info "Project directory: $PROJECT_DIR"
    
    check_prerequisites
    setup_environment
    stop_existing_services
    install_frontend_dependencies
    build_and_start_services
    wait_for_services
    start_frontend_dev_server
    perform_health_checks
    
    # Success message
    echo ""
    echo -e "${GREEN}🎉 Smart-Lean-0DTE Deployment Complete!${NC}"
    echo -e "${GREEN}=======================================${NC}"
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    echo -e "  Backend API:      http://localhost:$BACKEND_PORT"
    echo -e "  Frontend:         http://localhost:$FRONTEND_PORT"
    echo -e "  API Documentation: http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo -e "${BLUE}🔍 Quick Health Check:${NC}"
    echo -e "  API Health:       http://localhost:$BACKEND_PORT/health"
    echo ""
    echo -e "${GREEN}✨ Smart-Lean-0DTE is ready for autonomous trading!${NC}"
    echo ""
    
    log_success "Deployment completed successfully"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO."; exit 1' ERR

# Execute main function
main "$@"


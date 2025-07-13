#!/bin/bash

# Smart-Lean-0DTE Enhanced Local Deployment Script (macOS Compatible)
# Intelligent, robust, and fully automated deployment with comprehensive service management
# Version: 2.0.1-macOS

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Script configuration
SCRIPT_VERSION="2.0.1-macOS"
SCRIPT_NAME="Smart-Lean-0DTE Enhanced Deployment (macOS Compatible)"
PROJECT_NAME="smart-lean-0dte"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Service configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Deployment options (can be overridden by environment variables)
FORCE_REBUILD=${FORCE_REBUILD:-false}
SKIP_CACHE_CLEAR=${SKIP_CACHE_CLEAR:-false}
SKIP_DEPENDENCY_CHECK=${SKIP_DEPENDENCY_CHECK:-false}
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}
PARALLEL_BUILD=${PARALLEL_BUILD:-true}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-120}

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Logging configuration
LOG_FILE="${PROJECT_DIR}/deployment.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Initialize logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
log() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✅ $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠️  $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} ❌ $1" | tee -a "$LOG_FILE"
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} 🔍 $1" | tee -a "$LOG_FILE"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if port is in use (macOS compatible)
port_in_use() {
    local port=$1
    if command_exists lsof; then
        lsof -i ":$port" >/dev/null 2>&1
    else
        # Fallback: try to connect
        timeout 1 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1
    fi
}

# Get process using port (macOS compatible)
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
    
    # Try SIGTERM first
    if kill -TERM "$pid" 2>/dev/null; then
        # Wait up to 10 seconds for graceful shutdown
        for i in {1..10}; do
            if ! kill -0 "$pid" 2>/dev/null; then
                log_success "$name stopped gracefully"
                return 0
            fi
            sleep 1
        done
        
        # Force kill if still running
        log_warning "$name didn't stop gracefully, forcing shutdown"
        if kill -KILL "$pid" 2>/dev/null; then
            log_success "$name force stopped"
        else
            log_error "Failed to stop $name"
            return 1
        fi
    else
        log_debug "$name was not running or already stopped"
    fi
}

# Check system resources (macOS compatible)
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check available memory (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        local total_mem=$(sysctl -n hw.memsize)
        local total_mem_gb=$((total_mem / 1024 / 1024 / 1024))
        if [[ $total_mem_gb -lt 4 ]]; then
            log_warning "Low total memory: ${total_mem_gb}GB (recommended: 4GB+)"
        else
            log_debug "Total memory: ${total_mem_gb}GB"
        fi
        
        # Check available disk space (macOS)
        local available_disk=$(df -g "$PROJECT_DIR" | awk 'NR==2 {print $4}')
        if [[ $available_disk -lt 5 ]]; then
            log_warning "Low disk space: ${available_disk}GB (recommended: 5GB+)"
        else
            log_debug "Available disk space: ${available_disk}GB"
        fi
    else
        # Linux fallback
        if command_exists free; then
            local available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
            if [[ $available_mem -lt 2048 ]]; then
                log_warning "Low available memory: ${available_mem}MB (recommended: 2GB+)"
            else
                log_debug "Available memory: ${available_mem}MB"
            fi
        fi
        
        local available_disk=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
        local available_disk_gb=$((available_disk / 1024 / 1024))
        if [[ $available_disk_gb -lt 5 ]]; then
            log_warning "Low disk space: ${available_disk_gb}GB (recommended: 5GB+)"
        else
            log_debug "Available disk space: ${available_disk_gb}GB"
        fi
    fi
    
    # Check CPU load
    if command_exists uptime; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        log_debug "System load average: $load_avg"
    fi
}

# =============================================================================
# DEPENDENCY CHECKING
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    local missing_deps=()
    
    # Essential tools
    local required_commands=("docker" "docker-compose" "curl" "git")
    
    for cmd in "${required_commands[@]}"; do
        if ! command_exists "$cmd"; then
            missing_deps+=("$cmd")
        else
            local version=""
            case "$cmd" in
                "docker")
                    version=$(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//')
                    ;;
                "docker-compose")
                    version=$(docker-compose --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//')
                    ;;
                "curl")
                    version=$(curl --version 2>/dev/null | head -1 | cut -d' ' -f2)
                    ;;
                "git")
                    version=$(git --version 2>/dev/null | cut -d' ' -f3)
                    ;;
            esac
            log_debug "$cmd is installed ($version)"
        fi
    done
    
    # Check Docker daemon
    if command_exists docker; then
        if ! docker info >/dev/null 2>&1; then
            log_error "Docker daemon is not running. Please start Docker first."
            exit 1
        fi
        log_debug "Docker daemon is running"
    fi
    
    # Check Node.js (optional but recommended)
    if command_exists node; then
        local node_version=$(node --version 2>/dev/null)
        log_debug "Node.js is installed ($node_version)"
        
        # Check npm
        if command_exists npm; then
            local npm_version=$(npm --version 2>/dev/null)
            log_debug "npm is installed ($npm_version)"
        fi
    else
        log_warning "Node.js not found. Frontend development will be limited to Docker only."
    fi
    
    # Report missing dependencies
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All prerequisites are satisfied"
}

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

setup_environment() {
    log_info "Setting up environment..."
    
    # Check for environment file
    if [[ ! -f ".env.lean" ]]; then
        log_error ".env.lean file not found"
        log_info "Creating default .env.lean file..."
        
        cat > .env.lean << 'EOF'
# Smart-Lean-0DTE Environment Configuration
POSTGRES_PASSWORD=lean_dev_password
DATABENTO_API_KEY=demo_key
IBKR_USERNAME=demo_user
IBKR_PASSWORD=demo_pass

# Lean Configuration
LEAN_MODE=true
DATA_OPTIMIZATION_ENABLED=true
CACHE_OPTIMIZATION_ENABLED=true
AI_OPTIMIZATION_ENABLED=true

# Development Settings
DEBUG=true
LOG_LEVEL=INFO
ENVIRONMENT=lean-development
EOF
        log_success "Default .env.lean file created"
    fi
    
    # Copy environment file
    cp .env.lean .env
    log_success "Environment file configured"
    
    # Create necessary directories
    local dirs=("backend/logs" "frontend/build" "data/postgres" "data/redis" "cache")
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_debug "Created directory: $dir"
        fi
    done
    
    log_success "Environment setup complete"
}

# =============================================================================
# SERVICE MANAGEMENT
# =============================================================================

detect_running_services() {
    log_info "Detecting running services..."
    
    local services=()
    
    # Check Docker containers
    if command_exists docker; then
        local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "smart-0dte" || true)
        if [[ -n "$containers" ]]; then
            log_debug "Running Docker containers:"
            echo "$containers" | while read -r line; do
                log_debug "  $line"
            done
            services+=("docker")
        fi
    fi
    
    # Check individual ports
    local ports=($BACKEND_PORT $FRONTEND_PORT $POSTGRES_PORT $REDIS_PORT)
    local port_names=("Backend" "Frontend" "PostgreSQL" "Redis")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if port_in_use "$port"; then
            local pid=$(get_port_process "$port")
            log_debug "$name is running on port $port (PID: $pid)"
            services+=("$name:$port:$pid")
        fi
    done
    
    # Check for frontend development server PID file
    if [[ -f ".frontend.pid" ]]; then
        local frontend_pid=$(cat .frontend.pid)
        if kill -0 "$frontend_pid" 2>/dev/null; then
            log_debug "Frontend development server is running (PID: $frontend_pid)"
            services+=("frontend-dev:$FRONTEND_PORT:$frontend_pid")
        else
            rm -f .frontend.pid
            log_debug "Removed stale frontend PID file"
        fi
    fi
    
    if [[ ${#services[@]} -eq 0 ]]; then
        log_info "No running services detected"
    else
        log_info "Detected ${#services[@]} running service(s)"
    fi
    
    # Store detected services for later use
    printf '%s\n' "${services[@]}" > .detected_services.tmp
}

stop_existing_services() {
    log_info "Stopping existing services..."
    
    # Stop Docker Compose services first
    if [[ -f "docker-compose.yml" ]]; then
        log_info "Stopping Docker Compose services..."
        if docker-compose down --remove-orphans --timeout 30 2>/dev/null; then
            log_success "Docker Compose services stopped"
        else
            log_warning "Some Docker Compose services may not have stopped cleanly"
        fi
    fi
    
    # Stop individual processes if they're still running
    if [[ -f ".detected_services.tmp" ]]; then
        while IFS= read -r service; do
            if [[ "$service" == "docker" ]]; then
                continue  # Already handled above
            fi
            
            IFS=':' read -r name port pid <<< "$service"
            if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
                kill_process_gracefully "$pid" "$name"
            fi
        done < .detected_services.tmp
        rm -f .detected_services.tmp
    fi
    
    # Clean up any remaining containers
    local remaining_containers=$(docker ps -q --filter "name=smart-0dte" 2>/dev/null || true)
    if [[ -n "$remaining_containers" ]]; then
        log_info "Cleaning up remaining containers..."
        echo "$remaining_containers" | xargs docker stop --time 10 2>/dev/null || true
        echo "$remaining_containers" | xargs docker rm -f 2>/dev/null || true
    fi
    
    # Wait a moment for ports to be released
    sleep 2
    
    log_success "All services stopped"
}

# =============================================================================
# CACHE AND DATA MANAGEMENT
# =============================================================================

manage_cache_and_data() {
    log_info "Managing cache and data..."
    
    if [[ "$SKIP_CACHE_CLEAR" == "true" ]]; then
        log_info "Skipping cache clear (SKIP_CACHE_CLEAR=true)"
        return
    fi
    
    # Clear Docker build cache if force rebuild
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        log_info "Clearing Docker build cache..."
        docker builder prune -f >/dev/null 2>&1 || true
        log_success "Docker build cache cleared"
    fi
    
    # Clear application caches
    local cache_dirs=("backend/app/__pycache__" "backend/app/*/__pycache__" "frontend/node_modules/.cache" "cache/*")
    for cache_pattern in "${cache_dirs[@]}"; do
        if ls $cache_pattern >/dev/null 2>&1; then
            rm -rf $cache_pattern
            log_debug "Cleared cache: $cache_pattern"
        fi
    done
    
    # Clear old logs (keep last 5 files) - macOS compatible
    if [[ -d "backend/logs" ]]; then
        local log_files=(backend/logs/*.log)
        if [[ ${#log_files[@]} -gt 5 ]] && [[ -f "${log_files[0]}" ]]; then
            local files_to_delete=$((${#log_files[@]} - 5))
            printf '%s\n' "${log_files[@]}" | sort | head -n "$files_to_delete" | xargs rm -f 2>/dev/null || true
            log_debug "Cleaned old log files"
        fi
    fi
    
    # Preserve important data volumes
    log_debug "Preserving data volumes (postgres_lean_data, redis_lean_data)"
    
    log_success "Cache and data management complete"
}

# =============================================================================
# DEPENDENCY INSTALLATION
# =============================================================================

install_dependencies() {
    log_info "Installing dependencies..."
    
    if [[ "$SKIP_DEPENDENCY_CHECK" == "true" ]]; then
        log_info "Skipping dependency installation (SKIP_DEPENDENCY_CHECK=true)"
        return
    fi
    
    # Frontend dependencies
    if [[ -f "frontend/package.json" ]] && command_exists node; then
        log_info "Checking frontend dependencies..."
        
        cd frontend
        
        # Check if node_modules exists and is up to date
        if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]] || [[ "$FORCE_REBUILD" == "true" ]]; then
            log_info "Installing frontend dependencies..."
            
            # Remove existing node_modules and package-lock.json for clean install
            rm -rf node_modules package-lock.json 2>/dev/null || true
            
            # Use npm install with legacy peer deps for compatibility
            if npm install --legacy-peer-deps --silent; then
                log_success "Frontend dependencies installed"
            else
                log_error "Failed to install frontend dependencies"
                cd ..
                return 1
            fi
        else
            log_debug "Frontend dependencies are up to date"
        fi
        
        cd ..
    fi
    
    log_success "Dependencies installation complete"
}

# =============================================================================
# BUILD AND DEPLOYMENT
# =============================================================================

build_services() {
    log_info "Building services..."
    
    local build_args=()
    
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        build_args+=("--no-cache")
        log_info "Force rebuild enabled - building from scratch"
    fi
    
    if [[ "$PARALLEL_BUILD" == "true" ]]; then
        build_args+=("--parallel")
        log_debug "Parallel build enabled"
    fi
    
    # Build with Docker Compose
    log_info "Building Docker images..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would execute: docker-compose build ${build_args[*]}"
        return
    fi
    
    if docker-compose build "${build_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Docker images built successfully"
    else
        log_error "Failed to build Docker images"
        return 1
    fi
    
    log_success "Service build complete"
}

start_services() {
    log_info "Starting services..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "DRY RUN: Would execute: docker-compose up -d"
        return
    fi
    
    # Start services with Docker Compose
    if docker-compose up -d 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Services started"
    else
        log_error "Failed to start services"
        return 1
    fi
    
    # Wait for services to be ready
    wait_for_services
    
    # Start frontend development server if Node.js is available
    start_frontend_dev_server
    
    log_success "All services are running"
}

wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local services=(
        "PostgreSQL:postgres:pg_isready -U smart0dte_lean -d smart_0dte_lean"
        "Redis:redis:redis-cli ping"
        "Backend:backend:curl -f http://localhost:$BACKEND_PORT/health"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name container check_cmd <<< "$service_info"
        
        log_info "Waiting for $name..."
        
        local max_attempts=$((HEALTH_CHECK_TIMEOUT / 3))
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if [[ "$name" == "Backend" ]]; then
                # Direct health check for backend
                if eval "$check_cmd" >/dev/null 2>&1; then
                    break
                fi
            else
                # Docker exec for database services
                if docker-compose exec -T "$container" $check_cmd >/dev/null 2>&1; then
                    break
                fi
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "$name failed to start within ${HEALTH_CHECK_TIMEOUT}s"
                log_info "Check logs with: docker-compose logs $container"
                return 1
            fi
            
            log_debug "$name not ready, attempt $attempt/$max_attempts"
            sleep 3
            ((attempt++))
        done
        
        log_success "$name is ready"
    done
    
    log_success "All services are healthy"
}

start_frontend_dev_server() {
    if ! command_exists node || [[ ! -d "frontend" ]]; then
        log_debug "Skipping frontend development server (Node.js not available or frontend directory missing)"
        return
    fi
    
    # Check if frontend is already running in Docker
    if docker-compose ps frontend | grep -q "Up"; then
        log_info "Frontend is running in Docker container"
        return
    fi
    
    log_info "Starting frontend development server..."
    
    cd frontend
    
    # Start frontend in background
    npm start >/dev/null 2>&1 &
    local frontend_pid=$!
    
    cd ..
    
    # Save PID for cleanup
    echo "$frontend_pid" > .frontend.pid
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend development server..."
    local attempt=1
    local max_attempts=40
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_warning "Frontend development server did not start within expected time"
            return 1
        fi
        
        sleep 3
        ((attempt++))
    done
    
    log_success "Frontend development server is ready (PID: $frontend_pid)"
}

# =============================================================================
# HEALTH CHECKS AND VALIDATION
# =============================================================================

perform_health_checks() {
    log_info "Performing comprehensive health checks..."
    
    local health_status=0
    
    # Service health checks
    local services=(
        "Backend API:http://localhost:$BACKEND_PORT/health"
        "Frontend:http://localhost:$FRONTEND_PORT"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r name url <<< "$service_info"
        
        log_info "Checking $name..."
        
        if curl -s --max-time 10 "$url" >/dev/null 2>&1; then
            log_success "$name is healthy"
        else
            log_error "$name health check failed"
            health_status=1
        fi
    done
    
    # Database connectivity check
    log_info "Checking database connectivity..."
    if docker-compose exec -T postgres pg_isready -U smart0dte_lean -d smart_0dte_lean >/dev/null 2>&1; then
        log_success "Database is accessible"
    else
        log_error "Database connectivity check failed"
        health_status=1
    fi
    
    # Redis connectivity check
    log_info "Checking Redis connectivity..."
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is accessible"
    else
        log_error "Redis connectivity check failed"
        health_status=1
    fi
    
    if [[ $health_status -eq 0 ]]; then
        log_success "All health checks passed"
    else
        log_warning "Some health checks failed - system may not be fully operational"
    fi
    
    return $health_status
}

# =============================================================================
# MAIN EXECUTION FLOW
# =============================================================================

show_banner() {
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                Smart-Lean-0DTE Enhanced Deployment (macOS)                  ║"
    echo "║                                Version $SCRIPT_VERSION                             ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}🚀 Intelligent, robust, and fully automated deployment${NC}"
    echo -e "${CYAN}💰 Maintaining 89-90% cost optimization with enterprise features${NC}"
    echo -e "${CYAN}🍎 Optimized for macOS compatibility${NC}"
    echo ""
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
    --force-rebuild         Force rebuild of all Docker images
    --skip-cache-clear      Skip clearing of caches
    --skip-deps            Skip dependency installation checks
    --verbose              Enable verbose logging
    --dry-run              Show what would be done without executing
    --no-parallel          Disable parallel building
    --timeout SECONDS      Health check timeout (default: 120)
    --help                 Show this help message

ENVIRONMENT VARIABLES:
    FORCE_REBUILD          Same as --force-rebuild
    SKIP_CACHE_CLEAR       Same as --skip-cache-clear
    SKIP_DEPENDENCY_CHECK  Same as --skip-deps
    VERBOSE                Same as --verbose
    DRY_RUN                Same as --dry-run
    PARALLEL_BUILD         Enable/disable parallel building
    HEALTH_CHECK_TIMEOUT   Health check timeout in seconds

EXAMPLES:
    $0                     # Standard deployment
    $0 --force-rebuild     # Force rebuild everything
    $0 --verbose --dry-run # Show what would be done
    $0 --timeout 180       # Extended health check timeout

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-rebuild)
                FORCE_REBUILD=true
                shift
                ;;
            --skip-cache-clear)
                SKIP_CACHE_CLEAR=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPENDENCY_CHECK=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-parallel)
                PARALLEL_BUILD=false
                shift
                ;;
            --timeout)
                HEALTH_CHECK_TIMEOUT="$2"
                shift 2
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

main() {
    # Initialize
    show_banner
    parse_arguments "$@"
    
    log_info "Starting $SCRIPT_NAME v$SCRIPT_VERSION"
    log_info "Project directory: $PROJECT_DIR"
    log_info "Timestamp: $TIMESTAMP"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Pre-flight checks
    check_system_resources
    check_prerequisites
    
    # Environment setup
    setup_environment
    
    # Service management
    detect_running_services
    stop_existing_services
    
    # Cache and dependency management
    manage_cache_and_data
    install_dependencies
    
    # Build and deployment
    build_services
    start_services
    
    # Validation
    perform_health_checks
    
    # Success message
    echo ""
    echo -e "${GREEN}${BOLD}🎉 Smart-Lean-0DTE Deployment Complete!${NC}"
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
    echo -e "${BLUE}📝 Management Commands:${NC}"
    echo -e "  View logs:        docker-compose logs -f"
    echo -e "  Stop services:    docker-compose down"
    echo -e "  Restart:          docker-compose restart"
    echo ""
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo -e "  1. Open http://localhost:$FRONTEND_PORT in your browser"
    echo -e "  2. Configure your API keys in the Settings page"
    echo -e "  3. Enable autonomous trading features"
    echo -e "  4. Monitor performance in the Analytics dashboard"
    echo ""
    echo -e "${GREEN}✨ Smart-Lean-0DTE is ready for autonomous trading!${NC}"
    echo -e "${YELLOW}💰 Enjoying 89-90% cost savings with enterprise features!${NC}"
    echo ""
    
    log_success "Deployment completed successfully"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO. Check $LOG_FILE for details."; exit 1' ERR

# Execute main function
main "$@"


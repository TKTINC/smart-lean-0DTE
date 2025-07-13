#!/bin/bash

# Smart-Lean-0DTE Node.js Fix and Frontend Setup Script
# This script automatically downgrades Node.js to v20 LTS and sets up the frontend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Show banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║              Smart-Lean-0DTE Node.js Fix & Frontend Setup                  ║"
    echo "║                           Version 1.0.0                                     ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}🔧 Automatic Node.js downgrade to v20 LTS and frontend setup${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect shell type
detect_shell() {
    if [[ -n "$ZSH_VERSION" ]]; then
        echo "zsh"
    elif [[ -n "$BASH_VERSION" ]]; then
        echo "bash"
    else
        echo "bash"  # Default fallback
    fi
}

# Get shell profile file
get_shell_profile() {
    local shell_type=$(detect_shell)
    if [[ "$shell_type" == "zsh" ]]; then
        echo "$HOME/.zshrc"
    else
        echo "$HOME/.bashrc"
    fi
}

# Install NVM if not present
install_nvm() {
    if command_exists nvm; then
        log_info "NVM is already installed"
        return 0
    fi

    log_info "Installing Node Version Manager (NVM)..."
    
    # Download and install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Add NVM to shell profile
    local profile_file=$(get_shell_profile)
    
    # Source NVM for current session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    if command_exists nvm; then
        log_success "NVM installed successfully"
    else
        log_error "Failed to install NVM. Please install manually."
        exit 1
    fi
}

# Install and switch to Node.js 20 LTS
setup_node_20() {
    log_info "Current Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
    
    # Source NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    log_info "Installing Node.js 20 LTS..."
    nvm install 20
    
    log_info "Switching to Node.js 20..."
    nvm use 20
    
    log_info "Setting Node.js 20 as default..."
    nvm alias default 20
    
    # Verify installation
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    log_success "Node.js version: $node_version"
    log_success "npm version: $npm_version"
    
    if [[ "$node_version" == v20* ]]; then
        log_success "Node.js 20 LTS is now active"
    else
        log_warning "Node.js version might not be v20. Current: $node_version"
    fi
}

# Clean and setup frontend dependencies
setup_frontend() {
    log_info "Setting up frontend dependencies..."
    
    # Navigate to frontend directory
    if [[ ! -d "frontend" ]]; then
        log_error "Frontend directory not found. Please run this script from the project root."
        exit 1
    fi
    
    cd frontend
    
    # Clean existing dependencies
    log_info "Cleaning existing dependencies..."
    rm -rf node_modules package-lock.json 2>/dev/null || true
    
    # Clear npm cache
    log_info "Clearing npm cache..."
    npm cache clean --force
    
    # Install dependencies
    log_info "Installing frontend dependencies with Node.js 20..."
    npm install --legacy-peer-deps
    
    log_success "Frontend dependencies installed successfully"
    
    # Return to project root
    cd ..
}

# Start frontend development server
start_frontend() {
    log_info "Starting frontend development server..."
    
    cd frontend
    
    # Start in background and capture PID
    npm start &
    local frontend_pid=$!
    
    # Save PID for later cleanup
    echo "$frontend_pid" > ../.frontend.pid
    
    log_success "Frontend server started (PID: $frontend_pid)"
    log_info "Frontend will be available at: http://localhost:3000"
    log_info "Press Ctrl+C to stop the frontend server"
    
    # Wait for the frontend process
    wait $frontend_pid
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    if [[ -f ".frontend.pid" ]]; then
        local pid=$(cat .frontend.pid)
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            log_info "Frontend server stopped"
        fi
        rm -f .frontend.pid
    fi
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Main execution
main() {
    show_banner
    
    log_info "Starting Node.js fix and frontend setup..."
    log_info "Project directory: $(pwd)"
    
    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] && [[ ! -d "frontend" ]]; then
        log_error "Please run this script from the Smart-Lean-0DTE project root directory"
        exit 1
    fi
    
    # Install NVM
    install_nvm
    
    # Setup Node.js 20
    setup_node_20
    
    # Setup frontend
    setup_frontend
    
    # Show success message
    echo ""
    echo -e "${GREEN}🎉 Node.js Fix and Frontend Setup Complete!${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo -e "${BLUE}📊 System Status:${NC}"
    echo -e "  Node.js Version:  $(node --version)"
    echo -e "  npm Version:      $(npm --version)"
    echo -e "  Frontend Ready:   ✅"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "  1. Start frontend: cd frontend && npm start"
    echo -e "  2. Start backend:  cd backend && python app/main.py"
    echo -e "  3. Start databases: docker-compose up -d postgres redis"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "  Frontend:     http://localhost:3000"
    echo -e "  Backend API:  http://localhost:8000"
    echo -e "  API Docs:     http://localhost:8000/docs"
    echo ""
    echo -e "${GREEN}✨ Your Smart-Lean-0DTE system is ready!${NC}"
    echo ""
    
    # Ask if user wants to start frontend now
    read -p "Would you like to start the frontend development server now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_frontend
    else
        log_info "You can start the frontend later with: cd frontend && npm start"
    fi
}

# Execute main function
main "$@"


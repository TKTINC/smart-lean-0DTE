#!/bin/bash

# Smart-Lean-0DTE AJV Dependency Fix and Frontend Setup Script
# This script aggressively fixes ajv dependency conflicts and sets up the frontend

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
    echo "║              Smart-Lean-0DTE AJV Dependency Fix & Frontend Setup           ║"
    echo "║                           Version 2.0.0                                     ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${GREEN}🔧 Aggressive ajv dependency conflict resolution and frontend setup${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Backup original package.json
backup_package_json() {
    if [[ -f "frontend/package.json" ]]; then
        cp frontend/package.json frontend/package.json.backup
        log_info "Backed up original package.json"
    fi
}

# Create enhanced package.json with aggressive overrides
create_enhanced_package_json() {
    log_info "Creating enhanced package.json with aggressive dependency overrides..."
    
    cat > frontend/package.json << 'EOF'
{
  "name": "smart-lean-0dte-frontend",
  "version": "1.0.0",
  "description": "Smart-Lean-0DTE Frontend - Professional trading interface with cost optimization",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.3.0",
    "axios": "^1.4.0",
    "recharts": "^2.7.2",
    "lucide-react": "^0.263.1",
    "web-vitals": "^2.1.4",
    "ajv": "6.12.6",
    "ajv-keywords": "3.5.2",
    "ajv-formats": "1.6.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "overrides": {
    "ajv": "6.12.6",
    "ajv-keywords": "3.5.2",
    "ajv-formats": "1.6.1",
    "schema-utils": "3.3.0",
    "webpack": "5.88.2"
  },
  "resolutions": {
    "ajv": "6.12.6",
    "ajv-keywords": "3.5.2",
    "ajv-formats": "1.6.1",
    "schema-utils": "3.3.0"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:8000"
}
EOF

    log_success "Enhanced package.json created with aggressive dependency overrides"
}

# Method 1: Aggressive dependency override approach
method_1_aggressive_override() {
    log_info "Method 1: Aggressive dependency override approach"
    
    cd frontend
    
    # Backup and create enhanced package.json
    backup_package_json
    create_enhanced_package_json
    
    # Clean everything
    rm -rf node_modules package-lock.json .npm 2>/dev/null || true
    npm cache clean --force
    
    # Install with specific flags
    log_info "Installing dependencies with aggressive overrides..."
    npm install --legacy-peer-deps --force
    
    # Try to start
    log_info "Testing frontend startup..."
    timeout 10s npm start > /dev/null 2>&1 &
    local test_pid=$!
    sleep 5
    
    if kill -0 $test_pid 2>/dev/null; then
        kill $test_pid 2>/dev/null || true
        log_success "Method 1 successful! Frontend can start."
        cd ..
        return 0
    else
        log_warning "Method 1 failed. Trying Method 2..."
        cd ..
        return 1
    fi
}

# Method 2: Fresh React app approach
method_2_fresh_app() {
    log_info "Method 2: Creating fresh React app"
    
    # Create fresh React app
    log_info "Creating fresh React app with compatible dependencies..."
    npx create-react-app@latest frontend-new --template typescript
    
    # Copy source files
    log_info "Copying source files from original frontend..."
    if [[ -d "frontend/src" ]]; then
        cp -r frontend/src/* frontend-new/src/ 2>/dev/null || true
    fi
    
    if [[ -f "frontend/public/index.html" ]]; then
        cp frontend/public/index.html frontend-new/public/ 2>/dev/null || true
    fi
    
    # Install additional dependencies
    cd frontend-new
    log_info "Installing additional dependencies..."
    npm install recharts lucide-react axios react-router-dom
    
    # Test startup
    log_info "Testing fresh app startup..."
    timeout 10s npm start > /dev/null 2>&1 &
    local test_pid=$!
    sleep 5
    
    if kill -0 $test_pid 2>/dev/null; then
        kill $test_pid 2>/dev/null || true
        log_success "Method 2 successful! Fresh app can start."
        
        # Replace old frontend with new one
        cd ..
        mv frontend frontend-old
        mv frontend-new frontend
        log_info "Replaced old frontend with fresh working version"
        return 0
    else
        log_warning "Method 2 failed. Trying Method 3..."
        cd ..
        rm -rf frontend-new
        return 1
    fi
}

# Method 3: Minimal React setup
method_3_minimal_setup() {
    log_info "Method 3: Minimal React setup with basic dependencies"
    
    # Create minimal package.json
    mkdir -p frontend-minimal
    cd frontend-minimal
    
    cat > package.json << 'EOF'
{
  "name": "smart-lean-0dte-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "4.0.3",
    "react-router-dom": "^6.3.0",
    "axios": "^1.4.0",
    "recharts": "^2.7.2",
    "lucide-react": "^0.263.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  },
  "proxy": "http://localhost:8000"
}
EOF

    # Create basic public/index.html
    mkdir -p public
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Smart-Lean-0DTE</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
EOF

    # Create basic src structure
    mkdir -p src
    
    # Copy source files if they exist
    if [[ -d "../frontend/src" ]]; then
        cp -r ../frontend/src/* src/ 2>/dev/null || true
    else
        # Create minimal App.js
        cat > src/App.js << 'EOF'
import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Smart-Lean-0DTE System</h1>
      <p>Frontend is running successfully!</p>
      <p>Backend API: <a href="http://localhost:8000/docs">http://localhost:8000/docs</a></p>
    </div>
  );
}

export default App;
EOF

        cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
EOF
    fi
    
    # Install dependencies
    log_info "Installing minimal dependencies..."
    npm install --legacy-peer-deps
    
    # Test startup
    log_info "Testing minimal setup startup..."
    timeout 10s npm start > /dev/null 2>&1 &
    local test_pid=$!
    sleep 5
    
    if kill -0 $test_pid 2>/dev/null; then
        kill $test_pid 2>/dev/null || true
        log_success "Method 3 successful! Minimal setup can start."
        
        # Replace old frontend with minimal one
        cd ..
        mv frontend frontend-old
        mv frontend-minimal frontend
        log_info "Replaced old frontend with minimal working version"
        return 0
    else
        log_error "Method 3 failed. All methods exhausted."
        cd ..
        rm -rf frontend-minimal
        return 1
    fi
}

# Start frontend development server
start_frontend() {
    log_info "Starting frontend development server..."
    
    cd frontend
    
    # Start in background
    npm start &
    local frontend_pid=$!
    
    # Save PID for cleanup
    echo "$frontend_pid" > ../.frontend.pid
    
    log_success "Frontend server started (PID: $frontend_pid)"
    log_info "Frontend available at: http://localhost:3000"
    log_info "Press Ctrl+C to stop"
    
    # Wait for the process
    wait $frontend_pid
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    if [[ -f ".frontend.pid" ]]; then
        local pid=$(cat .frontend.pid)
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
        rm -f .frontend.pid
    fi
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Main execution
main() {
    show_banner
    
    log_info "Starting aggressive ajv dependency fix..."
    log_info "Project directory: $(pwd)"
    
    # Check if we're in the right directory
    if [[ ! -d "frontend" ]]; then
        log_error "Frontend directory not found. Please run from project root."
        exit 1
    fi
    
    # Try methods in order
    if method_1_aggressive_override; then
        log_success "Fixed using Method 1: Aggressive dependency overrides"
    elif method_2_fresh_app; then
        log_success "Fixed using Method 2: Fresh React app"
    elif method_3_minimal_setup; then
        log_success "Fixed using Method 3: Minimal React setup"
    else
        log_error "All methods failed. Manual intervention required."
        exit 1
    fi
    
    # Show success message
    echo ""
    echo -e "${GREEN}🎉 AJV Dependency Fix Complete!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    echo -e "${BLUE}📊 System Status:${NC}"
    echo -e "  Node.js Version:  $(node --version)"
    echo -e "  npm Version:      $(npm --version)"
    echo -e "  Frontend Fixed:   ✅"
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
    echo -e "${GREEN}✨ Your Smart-Lean-0DTE frontend is ready!${NC}"
    echo ""
    
    # Ask if user wants to start frontend
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


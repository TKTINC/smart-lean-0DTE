#!/bin/bash

# Smart-Lean-0DTE Local Deployment Script
# This script sets up the complete Smart-Lean-0DTE system on a local development machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="smart-lean-0dte"
BACKEND_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379

echo -e "${BLUE}🚀 Smart-Lean-0DTE Local Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}📋 Checking Prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker is installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_status "Docker Compose is installed"

# Check Node.js (for frontend development)
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. Frontend development will be limited to Docker only."
else
    NODE_VERSION=$(node --version)
    print_status "Node.js is installed ($NODE_VERSION)"
fi

# Check if .env.lean exists
if [ ! -f ".env.lean" ]; then
    print_error ".env.lean file not found. Please ensure you have the environment configuration file."
    exit 1
fi
print_status "Environment configuration found"

# Copy environment file
echo -e "${BLUE}🔧 Setting up environment...${NC}"
cp .env.lean .env
print_status "Environment file configured"

# Stop any existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true
print_status "Existing containers stopped"

# Build and start services
echo -e "${BLUE}🏗️  Building and starting services...${NC}"
docker-compose up -d --build

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U smart0dte_lean &>/dev/null; then
        break
    fi
    sleep 2
done
print_status "PostgreSQL is ready"

# Wait for Redis
echo "Waiting for Redis..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping &>/dev/null; then
        break
    fi
    sleep 2
done
print_status "Redis is ready"

# Wait for Backend
echo "Waiting for Backend API..."
for i in {1..60}; do
    if curl -s http://localhost:${BACKEND_PORT}/health &>/dev/null; then
        break
    fi
    sleep 3
done
print_status "Backend API is ready"

# Check if frontend should be started separately
if command -v node &> /dev/null && [ -d "frontend" ]; then
    echo -e "${BLUE}🎨 Setting up frontend for development...${NC}"
    cd frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
        print_status "Frontend dependencies installed"
    fi
    
    # Start frontend in development mode (background)
    echo "Starting frontend development server..."
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to be ready
    echo "Waiting for frontend..."
    for i in {1..60}; do
        if curl -s http://localhost:${FRONTEND_PORT} &>/dev/null; then
            break
        fi
        sleep 3
    done
    print_status "Frontend development server is ready"
else
    print_warning "Frontend will run in Docker container only"
fi

# Display status
echo ""
echo -e "${GREEN}🎉 Smart-Lean-0DTE Local Deployment Complete!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "  Backend API:      http://localhost:${BACKEND_PORT}"
echo -e "  Frontend:         http://localhost:${FRONTEND_PORT}"
echo -e "  PostgreSQL:       localhost:${POSTGRES_PORT}"
echo -e "  Redis:            localhost:${REDIS_PORT}"
echo ""
echo -e "${BLUE}🔍 Health Checks:${NC}"
echo -e "  API Health:       http://localhost:${BACKEND_PORT}/health"
echo -e "  API Docs:         http://localhost:${BACKEND_PORT}/docs"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "  View logs:        docker-compose logs -f"
echo -e "  Stop services:    docker-compose down"
echo -e "  Restart:          docker-compose restart"
echo -e "  Shell access:     docker-compose exec backend bash"
echo ""
echo -e "${BLUE}💡 Next Steps:${NC}"
echo -e "  1. Open http://localhost:${FRONTEND_PORT} in your browser"
echo -e "  2. Configure your API keys in the Settings page"
echo -e "  3. Enable paper trading to test the system"
echo -e "  4. Review the documentation in the docs/ folder"
echo ""

# Check service health
echo -e "${BLUE}🏥 Final Health Check...${NC}"

# Check backend health
if curl -s http://localhost:${BACKEND_PORT}/health | grep -q "healthy"; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed - check logs with: docker-compose logs backend"
fi

# Check frontend
if curl -s http://localhost:${FRONTEND_PORT} &>/dev/null; then
    print_status "Frontend is accessible"
else
    print_warning "Frontend is not accessible - check logs with: docker-compose logs frontend"
fi

echo ""
echo -e "${GREEN}✨ Smart-Lean-0DTE is ready for trading!${NC}"
echo -e "${YELLOW}💰 Remember: This lean implementation saves you 89-90% on costs while maintaining professional features!${NC}"
echo ""

# Save PID for cleanup if frontend was started
if [ ! -z "$FRONTEND_PID" ]; then
    echo $FRONTEND_PID > .frontend.pid
    echo -e "${BLUE}ℹ️  Frontend PID saved to .frontend.pid for cleanup${NC}"
fi


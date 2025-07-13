# Smart-Lean-0DTE Local Deployment Guide

**Complete Step-by-Step Guide for Local Development Setup**

This guide will walk you through setting up the Smart-Lean-0DTE system on your local development machine. The local setup is perfect for development, testing, and small-scale trading operations.

## 📋 Prerequisites

### Required Software

1. **Docker & Docker Compose**
   ```bash
   # Install Docker (Ubuntu/Debian)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   
   # Verify installation
   docker --version
   docker-compose --version
   ```

2. **Node.js (Optional - for frontend development)**
   ```bash
   # Install Node.js 18+ (Ubuntu/Debian)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

3. **Git**
   ```bash
   # Install Git (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install git
   
   # Verify installation
   git --version
   ```

### System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended
- **OS**: Linux, macOS, or Windows with WSL2

## 🚀 Quick Start (Automated)

### Option 1: One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/TKTINC/smart-lean-0DTE.git
cd smart-lean-0DTE

# Run the automated deployment script
./deploy-local.sh
```

The script will:
- ✅ Check all prerequisites
- ✅ Set up environment configuration
- ✅ Build and start all services
- ✅ Perform health checks
- ✅ Display access URLs and useful commands

**That's it! Skip to the [Verification](#verification) section.**

## 🔧 Manual Setup (Step-by-Step)

### Step 1: Clone the Repository

```bash
git clone https://github.com/TKTINC/smart-lean-0DTE.git
cd smart-lean-0DTE
```

### Step 2: Environment Configuration

```bash
# Copy the lean environment template
cp .env.lean .env

# Edit the environment file with your settings
nano .env  # or use your preferred editor
```

**Key Configuration Variables:**
```bash
# Database Configuration
POSTGRES_DB=smart_0dte_lean
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_URL=redis://redis:6379

# API Keys (Required for live trading)
DATABENTO_API_KEY=your_databento_key
IBKR_USERNAME=your_ibkr_username
IBKR_PASSWORD=your_ibkr_password

# Trading Configuration
PAPER_TRADING=true  # Set to false for live trading
MAX_POSITIONS=10
RISK_LEVEL=medium

# Cost Optimization Settings
ENABLE_CACHING=true
CACHE_TTL=300
DATA_COMPRESSION=true
```

### Step 3: Start the Services

```bash
# Build and start all services
docker-compose up -d --build

# View logs (optional)
docker-compose logs -f
```

### Step 4: Wait for Services

```bash
# Check service status
docker-compose ps

# Wait for all services to be healthy (usually 2-3 minutes)
# You can monitor the logs:
docker-compose logs -f backend
```

### Step 5: Frontend Setup (Optional)

If you want to run the frontend in development mode:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will be available at http://localhost:3000

## 🏥 Verification

### Check Service Health

1. **Backend API Health**
   ```bash
   curl http://localhost:8000/health
   # Expected response: {"status": "healthy", "timestamp": "..."}
   ```

2. **Database Connection**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   # Expected response: /var/lib/postgresql/data:5432 - accepting connections
   ```

3. **Redis Connection**
   ```bash
   docker-compose exec redis redis-cli ping
   # Expected response: PONG
   ```

4. **Frontend Access**
   - Open http://localhost:3000 in your browser
   - You should see the Smart-Lean-0DTE dashboard

### API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎯 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Trading dashboard and UI |
| Backend API | http://localhost:8000 | REST API and business logic |
| API Docs | http://localhost:8000/docs | Interactive API documentation |
| PostgreSQL | localhost:5432 | Database (internal) |
| Redis | localhost:6379 | Cache and pub/sub (internal) |

## 🔧 Development Workflow

### Making Code Changes

1. **Backend Changes**
   ```bash
   # Edit Python files in backend/
   # The container will auto-reload on changes
   docker-compose restart backend
   ```

2. **Frontend Changes**
   ```bash
   # If running npm start, changes auto-reload
   # If using Docker, rebuild:
   docker-compose up -d --build frontend
   ```

3. **Database Changes**
   ```bash
   # Access database shell
   docker-compose exec postgres psql -U postgres -d smart_0dte_lean
   
   # Run migrations (if any)
   docker-compose exec backend python -m alembic upgrade head
   ```

### Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Access backend shell
docker-compose exec backend bash

# Access database shell
docker-compose exec postgres psql -U postgres -d smart_0dte_lean

# Monitor resource usage
docker stats
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo lsof -i :8000
   sudo lsof -i :3000
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Frontend Not Loading**
   ```bash
   # Check if backend is running
   curl http://localhost:8000/health
   
   # Check frontend logs
   docker-compose logs frontend
   
   # Rebuild frontend
   docker-compose up -d --build frontend
   ```

4. **Permission Denied**
   ```bash
   # Fix Docker permissions
   sudo usermod -aG docker $USER
   # Log out and log back in
   
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Performance Issues

1. **Slow Startup**
   - Increase Docker memory allocation (Docker Desktop: Settings > Resources)
   - Close unnecessary applications
   - Use SSD storage if possible

2. **High CPU Usage**
   ```bash
   # Check resource usage
   docker stats
   
   # Reduce concurrent processes in .env
   MAX_WORKERS=2
   ```

### Log Analysis

```bash
# Check all service logs
docker-compose logs --tail=100

# Filter for errors
docker-compose logs | grep -i error

# Follow logs in real-time
docker-compose logs -f --tail=50
```

## 🔒 Security Considerations

### Local Development Security

1. **Change Default Passwords**
   ```bash
   # Update .env file
   POSTGRES_PASSWORD=your_secure_password
   REDIS_PASSWORD=your_redis_password
   ```

2. **API Key Security**
   ```bash
   # Never commit real API keys
   # Use environment variables
   # Consider using .env.local for sensitive data
   ```

3. **Network Security**
   ```bash
   # Services are only accessible locally by default
   # Don't expose ports unnecessarily
   ```

## 📊 Monitoring

### Health Monitoring

```bash
# Create a simple health check script
cat > health_check.sh << 'EOF'
#!/bin/bash
echo "=== Smart-Lean-0DTE Health Check ==="
echo "Backend: $(curl -s http://localhost:8000/health | jq -r .status)"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
echo "Database: $(docker-compose exec -T postgres pg_isready -U postgres)"
echo "Redis: $(docker-compose exec -T redis redis-cli ping)"
EOF

chmod +x health_check.sh
./health_check.sh
```

### Performance Monitoring

```bash
# Monitor Docker resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Monitor logs for performance issues
docker-compose logs | grep -E "(slow|timeout|error)"
```

## 🚀 Next Steps

### After Successful Setup

1. **Configure Trading Parameters**
   - Open http://localhost:3000/settings
   - Set your risk tolerance and position limits
   - Configure API keys for live data

2. **Test Paper Trading**
   - Ensure `PAPER_TRADING=true` in .env
   - Monitor the dashboard for signals
   - Verify order execution in the Trading tab

3. **Review Documentation**
   - Read the [Complete Implementation Guide](Smart-0DTE-Lean-System-Complete-Guide.md)
   - Understand the [Cost Optimization](modular-cost-optimization-analysis.md)
   - Compare with other [implementations](Three-Implementation-Comparison.md)

4. **Prepare for Production**
   - Review the [Cloud Deployment Guide](Cloud-Deployment-Guide.md)
   - Plan your AWS infrastructure
   - Consider scaling requirements

## 💡 Tips for Success

### Development Best Practices

1. **Use Version Control**
   ```bash
   # Create your own branch for customizations
   git checkout -b my-customizations
   git add .
   git commit -m "My local customizations"
   ```

2. **Backup Configuration**
   ```bash
   # Backup your environment
   cp .env .env.backup
   
   # Backup database
   docker-compose exec postgres pg_dump -U postgres smart_0dte_lean > backup.sql
   ```

3. **Monitor Costs Even Locally**
   - Track resource usage
   - Optimize queries and caching
   - Test cost-optimization features

### Performance Optimization

1. **Database Optimization**
   ```bash
   # Monitor query performance
   docker-compose exec postgres psql -U postgres -d smart_0dte_lean -c "
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;"
   ```

2. **Cache Optimization**
   ```bash
   # Monitor Redis performance
   docker-compose exec redis redis-cli info stats
   ```

---

**🎉 Congratulations! You now have a fully functional Smart-Lean-0DTE system running locally.**

**💰 Cost Advantage**: Even in local development, you're using the same lean architecture that saves 89-90% on production costs!

For production deployment, see the [Cloud Deployment Guide](Cloud-Deployment-Guide.md).


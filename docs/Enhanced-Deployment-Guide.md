# Enhanced Deployment Script Guide

## Overview

The `deploy-local-enhanced.sh` script is an intelligent, robust, and fully automated deployment solution for the Smart-Lean-0DTE system. It provides comprehensive service management, cache handling, and sequence-aware deployment capabilities.

## Features

### 🚀 **Intelligent Deployment**
- **Automatic Service Detection**: Detects running services and handles them gracefully
- **Sequence-Aware Deployment**: Starts services in the correct order with proper dependencies
- **Health Monitoring**: Comprehensive health checks with configurable timeouts
- **Error Recovery**: Graceful error handling with detailed logging

### 🛠️ **Robust Service Management**
- **Graceful Shutdowns**: SIGTERM followed by SIGKILL if necessary
- **Port Conflict Resolution**: Detects and resolves port conflicts automatically
- **Container Cleanup**: Removes orphaned containers and networks
- **Process Management**: Handles both Docker and native processes

### 💾 **Smart Cache Management**
- **Selective Cache Clearing**: Clears only necessary caches
- **Build Optimization**: Docker layer caching and parallel builds
- **Dependency Management**: Smart dependency installation and updates
- **Data Preservation**: Protects important data volumes

### 📊 **Comprehensive Monitoring**
- **Real-time Logging**: Detailed logs with timestamps and severity levels
- **Progress Indicators**: Visual progress feedback during operations
- **System Resource Monitoring**: Memory, disk, and CPU usage tracking
- **Deployment Reports**: Detailed post-deployment reports

## Usage

### Basic Usage

```bash
# Standard deployment
./deploy-local-enhanced.sh

# Force rebuild everything
./deploy-local-enhanced.sh --force-rebuild

# Verbose output with dry-run
./deploy-local-enhanced.sh --verbose --dry-run
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--force-rebuild` | Force rebuild of all Docker images |
| `--skip-cache-clear` | Skip clearing of caches |
| `--skip-deps` | Skip dependency installation checks |
| `--verbose` | Enable verbose logging |
| `--dry-run` | Show what would be done without executing |
| `--no-parallel` | Disable parallel building |
| `--timeout SECONDS` | Health check timeout (default: 120) |
| `--help` | Show help message |

### Environment Variables

You can also control the script behavior using environment variables:

```bash
export FORCE_REBUILD=true
export VERBOSE=true
export HEALTH_CHECK_TIMEOUT=180
./deploy-local-enhanced.sh
```

| Variable | Description |
|----------|-------------|
| `FORCE_REBUILD` | Same as `--force-rebuild` |
| `SKIP_CACHE_CLEAR` | Same as `--skip-cache-clear` |
| `SKIP_DEPENDENCY_CHECK` | Same as `--skip-deps` |
| `VERBOSE` | Same as `--verbose` |
| `DRY_RUN` | Same as `--dry-run` |
| `PARALLEL_BUILD` | Enable/disable parallel building |
| `HEALTH_CHECK_TIMEOUT` | Health check timeout in seconds |

## Deployment Process

### 1. Pre-flight Checks
- **System Resources**: Checks available memory (2GB+) and disk space (5GB+)
- **Prerequisites**: Verifies Docker, Docker Compose, curl, and git
- **Docker Daemon**: Ensures Docker daemon is running
- **Node.js**: Optional check for frontend development

### 2. Environment Setup
- **Environment File**: Creates or validates `.env.lean` configuration
- **Directory Structure**: Creates necessary directories with proper permissions
- **Configuration Validation**: Validates all required configuration files

### 3. Service Management
- **Service Detection**: Scans for running Docker containers and processes
- **Graceful Shutdown**: Stops services with SIGTERM, then SIGKILL if needed
- **Port Liberation**: Ensures all required ports are available
- **Cleanup**: Removes orphaned containers and networks

### 4. Cache and Data Management
- **Docker Cache**: Clears build cache if force rebuild is enabled
- **Application Cache**: Removes Python `__pycache__` and Node.js cache
- **Log Rotation**: Keeps only the last 5 log files
- **Data Preservation**: Protects PostgreSQL and Redis data volumes

### 5. Dependency Installation
- **Backend Dependencies**: Checks and updates Python requirements
- **Frontend Dependencies**: Installs or updates Node.js packages
- **Smart Detection**: Only installs if package files have changed
- **Parallel Processing**: Uses `npm ci` for faster installs when possible

### 6. Build and Deployment
- **Docker Images**: Builds backend and frontend images
- **Parallel Building**: Builds multiple images simultaneously
- **Layer Caching**: Optimizes build times with Docker layer caching
- **Build Verification**: Confirms all expected images were created

### 7. Service Startup
- **Sequential Startup**: Starts services in dependency order
- **Health Monitoring**: Waits for each service to be healthy
- **Timeout Management**: Configurable timeouts for each service
- **Frontend Development**: Optionally starts Node.js dev server

### 8. Health Validation
- **API Health Checks**: Validates backend API endpoints
- **Database Connectivity**: Tests PostgreSQL and Redis connections
- **Port Verification**: Confirms all services are listening
- **Frontend Accessibility**: Validates frontend application

### 9. Reporting
- **Deployment Report**: Generates comprehensive deployment report
- **Service Status**: Lists all running services and endpoints
- **Useful Commands**: Provides management commands for ongoing operations
- **Troubleshooting**: Includes troubleshooting information

## Advanced Features

### Intelligent Service Detection

The script can detect various types of running services:

```bash
# Docker containers
docker ps --filter "name=smart-0dte"

# Processes using specific ports
lsof -i :8000

# Frontend development servers
cat .frontend.pid
```

### Graceful Process Management

Services are stopped gracefully with proper signal handling:

1. **SIGTERM** - Request graceful shutdown
2. **Wait 10 seconds** - Allow time for cleanup
3. **SIGKILL** - Force termination if needed

### Smart Cache Management

The script intelligently manages different types of caches:

- **Docker Build Cache**: Cleared only on force rebuild
- **Python Cache**: `__pycache__` directories
- **Node.js Cache**: `node_modules/.cache`
- **Application Cache**: Custom cache directories

### Health Check System

Comprehensive health checks with configurable timeouts:

```bash
# PostgreSQL
pg_isready -U smart0dte_lean -d smart_0dte_lean

# Redis
redis-cli ping

# Backend API
curl -f http://localhost:8000/health

# Frontend
curl -s http://localhost:3000
```

## Troubleshooting

### Common Issues

#### Docker Daemon Not Running
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

#### Permission Issues
```bash
sudo usermod -aG docker $USER
newgrp docker
```

#### Port Conflicts
The script automatically detects and resolves port conflicts by stopping conflicting processes.

#### Memory Issues
Ensure at least 2GB of available memory:
```bash
free -h
```

#### Disk Space Issues
Ensure at least 5GB of available disk space:
```bash
df -h
```

### Log Analysis

The script generates detailed logs in `deployment.log`:

```bash
# View recent logs
tail -f deployment.log

# Search for errors
grep ERROR deployment.log

# View specific service logs
docker-compose logs backend
```

### Manual Recovery

If the script fails, you can manually recover:

```bash
# Stop all services
docker-compose down -v

# Clean up containers
docker system prune -f

# Remove volumes (if needed)
docker volume prune -f

# Restart deployment
./deploy-local-enhanced.sh --force-rebuild
```

## Performance Optimization

### Build Performance

- **Parallel Building**: Enabled by default
- **Layer Caching**: Optimizes Docker builds
- **Dependency Caching**: Reuses installed packages

### Resource Management

- **Memory Limits**: Services have defined memory limits
- **CPU Limits**: Prevents resource exhaustion
- **Disk Usage**: Automatic cleanup of old files

### Network Optimization

- **Bridge Networks**: Optimized container networking
- **Port Management**: Efficient port allocation
- **Health Checks**: Minimal overhead monitoring

## Security Considerations

### File Permissions

The script sets appropriate permissions:
- Executable scripts: `755`
- Configuration files: `644`
- Data directories: `755`

### Container Security

- **Non-root Users**: Containers run as non-root when possible
- **Resource Limits**: Prevents resource exhaustion attacks
- **Network Isolation**: Services use isolated networks

### Credential Management

- **Environment Variables**: Sensitive data in environment files
- **File Permissions**: Restricted access to configuration files
- **No Hardcoded Secrets**: All secrets externalized

## Integration with CI/CD

The script is designed for CI/CD integration:

```bash
# CI/CD pipeline example
export FORCE_REBUILD=true
export VERBOSE=false
export HEALTH_CHECK_TIMEOUT=300
./deploy-local-enhanced.sh
```

### Exit Codes

- `0`: Success
- `1`: General error
- `2`: Missing dependencies
- `3`: Health check failure

## Maintenance

### Regular Maintenance

```bash
# Weekly cleanup
./deploy-local-enhanced.sh --force-rebuild

# Monthly full cleanup
docker system prune -af
./deploy-local-enhanced.sh --force-rebuild
```

### Log Rotation

The script automatically rotates logs, keeping only the last 5 files.

### Update Process

To update the deployment script:

1. Backup current script
2. Download new version
3. Test with `--dry-run`
4. Deploy with new script

## Conclusion

The enhanced deployment script provides a robust, intelligent, and fully automated solution for deploying the Smart-Lean-0DTE system. It handles edge cases, provides comprehensive monitoring, and ensures reliable deployments regardless of the current system state.

Key benefits:
- **Zero-downtime deployments** with graceful service management
- **Intelligent caching** for faster subsequent deployments
- **Comprehensive health monitoring** with detailed reporting
- **Flexible configuration** via command line and environment variables
- **Production-ready** with proper error handling and logging


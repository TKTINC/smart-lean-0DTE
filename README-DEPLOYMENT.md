# Smart-Lean-0DTE Enhanced Deployment

## Quick Start

The enhanced `deploy-local.sh` script provides intelligent, robust, and fully automated deployment with comprehensive service management.

### One-Command Deployment

```bash
# Standard deployment
./deploy-local.sh

# Force rebuild everything (recommended for first run or major updates)
./deploy-local.sh --force-rebuild

# See what would happen without making changes
./deploy-local.sh --dry-run --verbose
```

## Key Features

✅ **Intelligent Service Detection** - Automatically detects and manages running services  
✅ **Graceful Shutdowns** - Properly stops services with SIGTERM/SIGKILL sequence  
✅ **Smart Cache Management** - Selective cache clearing and build optimization  
✅ **Sequence-Aware Deployment** - Starts services in correct dependency order  
✅ **Comprehensive Health Checks** - Validates all services with configurable timeouts  
✅ **Detailed Logging** - Complete deployment logs with timestamps  
✅ **Error Recovery** - Robust error handling and recovery mechanisms  
✅ **Resource Monitoring** - Checks system resources before deployment  

## Common Usage Patterns

```bash
# Fresh deployment (first time or after major changes)
./deploy-local.sh --force-rebuild

# Quick deployment (preserving caches)
./deploy-local.sh --skip-cache-clear

# Development deployment (verbose output)
./deploy-local.sh --verbose

# CI/CD deployment (extended timeout)
./deploy-local.sh --timeout 300

# Troubleshooting deployment
./deploy-local.sh --dry-run --verbose
```

## What the Script Does

1. **Pre-flight Checks** - Validates system resources and prerequisites
2. **Environment Setup** - Configures environment files and directories
3. **Service Management** - Detects and gracefully stops existing services
4. **Cache Management** - Clears caches intelligently based on options
5. **Dependency Installation** - Updates backend and frontend dependencies
6. **Build Process** - Builds Docker images with optimization
7. **Service Startup** - Starts services in correct sequence
8. **Health Validation** - Comprehensive health checks
9. **Reporting** - Generates deployment report and status

## Service Endpoints

After successful deployment:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Troubleshooting

### If deployment fails:

1. **Check logs**: `cat deployment.log`
2. **View service logs**: `docker-compose logs -f`
3. **Try force rebuild**: `./deploy-local.sh --force-rebuild`
4. **Clean start**: `docker-compose down -v && ./deploy-local.sh --force-rebuild`

### Common issues:

- **Docker not running**: `sudo systemctl start docker`
- **Permission issues**: `sudo usermod -aG docker $USER && newgrp docker`
- **Port conflicts**: Script automatically handles these
- **Low memory**: Ensure 2GB+ available memory
- **Low disk space**: Ensure 5GB+ available space

## Advanced Options

See `./deploy-local.sh --help` for all options or check the [Enhanced Deployment Guide](docs/Enhanced-Deployment-Guide.md) for detailed documentation.

## Cost Optimization

This enhanced deployment maintains the 89-90% cost optimization of the Smart-Lean-0DTE system while providing enterprise-grade deployment capabilities:

- **Lean Infrastructure**: Optimized resource allocation
- **Smart Caching**: Reduces build times and resource usage
- **Efficient Scaling**: Minimal resource footprint
- **Automated Management**: Reduces operational overhead

---

**The script is designed to be run anytime you need to ensure a fresh deployment, regardless of what has changed. It's intelligent enough to handle any scenario gracefully.**


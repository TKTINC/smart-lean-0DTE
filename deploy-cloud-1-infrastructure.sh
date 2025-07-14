#!/bin/bash

# Smart-Lean-0DTE Cloud Infrastructure Setup
# Stage 1: Infrastructure and Dependencies

set -e  # Exit on any error

echo "🚀 Smart-Lean-0DTE Cloud Deployment - Stage 1: Infrastructure Setup"
echo "=================================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System packages updated"

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    nano \
    vim \
    tree \
    jq
print_success "Essential packages installed"

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_warning "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_warning "Docker Compose already installed"
fi

# Install Python 3.11
print_status "Installing Python 3.11..."
if ! command -v python3.11 &> /dev/null; then
    sudo add-apt-repository ppa:deadsnakes/ppa -y
    sudo apt update
    sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    
    # Set Python 3.11 as default python3
    sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
    print_success "Python 3.11 installed successfully"
else
    print_warning "Python 3.11 already installed"
fi

# Install Node.js and npm
print_status "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js and npm installed successfully"
else
    print_warning "Node.js already installed"
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib postgresql-client
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    print_success "PostgreSQL installed successfully"
else
    print_warning "PostgreSQL already installed"
fi

# Install Redis
print_status "Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    print_success "Redis installed successfully"
else
    print_warning "Redis already installed"
fi

# Install Nginx (for production frontend serving)
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed successfully"
else
    print_warning "Nginx already installed"
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 8000/tcp   # Backend API
sudo ufw allow 3000/tcp   # Frontend (development)
sudo ufw allow 4001/tcp   # IBKR Gateway
sudo ufw allow 4002/tcp   # IBKR Gateway (backup)
sudo ufw allow 5432/tcp   # PostgreSQL (if external access needed)
sudo ufw allow 6379/tcp   # Redis (if external access needed)

sudo ufw --force enable
print_success "Firewall configured"

# Create application directory structure
print_status "Creating application directories..."
sudo mkdir -p /opt/smart-lean-0dte
sudo chown $USER:$USER /opt/smart-lean-0dte
mkdir -p /opt/smart-lean-0dte/{logs,data,backups,config}
print_success "Application directories created"

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/smart-lean-0dte > /dev/null <<EOF
/opt/smart-lean-0dte/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload smart-lean-backend || true
    endscript
}
EOF
print_success "Log rotation configured"

# Install Python packages globally needed
print_status "Installing global Python packages..."
python3 -m pip install --upgrade pip
python3 -m pip install --user \
    virtualenv \
    wheel \
    setuptools
print_success "Global Python packages installed"

# Setup environment file template
print_status "Creating environment configuration template..."
cat > /opt/smart-lean-0dte/config/.env.template << EOF
# Smart-Lean-0DTE Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://smart_lean:CHANGE_PASSWORD@localhost:5432/smart_lean_0dte
REDIS_URL=redis://localhost:6379/0

# Databento Configuration
DATABENTO_API_KEY=YOUR_DATABENTO_API_KEY_HERE
DATABENTO_DATASET=OPRA.TRADES
DATABENTO_LIVE_GATEWAY=wss://live.databento.com/v0/live
DATABENTO_HIST_GATEWAY=https://hist.databento.com/v0/

# IBKR Configuration
IBKR_GATEWAY_HOST=localhost
IBKR_GATEWAY_PORT=4001
IBKR_CLIENT_ID=1
IBKR_ACCOUNT=YOUR_IBKR_ACCOUNT
IBKR_PAPER_TRADING=true

# Application Configuration
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=false
APP_SECRET_KEY=CHANGE_THIS_SECRET_KEY

# Trading Configuration
MAX_POSITIONS=10
POSITION_SIZE=1000
STOP_LOSS_PCT=15
TAKE_PROFIT_PCT=25
CONFIDENCE_THRESHOLD=70

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/opt/smart-lean-0dte/logs/application.log
EOF
print_success "Environment template created"

# Create systemd service files
print_status "Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/smart-lean-backend.service > /dev/null <<EOF
[Unit]
Description=Smart-Lean-0DTE Backend Service
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=/opt/smart-lean-0dte/backend
Environment=PATH=/usr/bin:/usr/local/bin
EnvironmentFile=/opt/smart-lean-0dte/config/.env
ExecStart=/usr/bin/python3 app/main.py
Restart=always
RestartSec=10
StandardOutput=append:/opt/smart-lean-0dte/logs/backend.log
StandardError=append:/opt/smart-lean-0dte/logs/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (for simple HTTP server)
sudo tee /etc/systemd/system/smart-lean-frontend.service > /dev/null <<EOF
[Unit]
Description=Smart-Lean-0DTE Frontend Service
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=/opt/smart-lean-0dte/simple-frontend
ExecStart=/usr/bin/python3 -m http.server 3000
Restart=always
RestartSec=5
StandardOutput=append:/opt/smart-lean-0dte/logs/frontend.log
StandardError=append:/opt/smart-lean-0dte/logs/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
print_success "Systemd services created"

# Setup monitoring script
print_status "Creating monitoring script..."
cat > /opt/smart-lean-0dte/monitor.sh << 'EOF'
#!/bin/bash

# Smart-Lean-0DTE System Monitor

echo "Smart-Lean-0DTE System Status"
echo "============================="
echo

# Check system resources
echo "System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
echo

# Check services
echo "Service Status:"
systemctl is-active --quiet smart-lean-backend && echo "✅ Backend: Running" || echo "❌ Backend: Stopped"
systemctl is-active --quiet smart-lean-frontend && echo "✅ Frontend: Running" || echo "❌ Frontend: Stopped"
systemctl is-active --quiet postgresql && echo "✅ PostgreSQL: Running" || echo "❌ PostgreSQL: Stopped"
systemctl is-active --quiet redis-server && echo "✅ Redis: Running" || echo "❌ Redis: Stopped"
systemctl is-active --quiet nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Stopped"
echo

# Check ports
echo "Port Status:"
ss -tuln | grep -q ":8000 " && echo "✅ Backend API (8000): Listening" || echo "❌ Backend API (8000): Not listening"
ss -tuln | grep -q ":3000 " && echo "✅ Frontend (3000): Listening" || echo "❌ Frontend (3000): Not listening"
ss -tuln | grep -q ":80 " && echo "✅ HTTP (80): Listening" || echo "❌ HTTP (80): Not listening"
ss -tuln | grep -q ":5432 " && echo "✅ PostgreSQL (5432): Listening" || echo "❌ PostgreSQL (5432): Not listening"
echo

# Check log files
echo "Recent Logs:"
if [ -f /opt/smart-lean-0dte/logs/backend.log ]; then
    echo "Backend (last 3 lines):"
    tail -n 3 /opt/smart-lean-0dte/logs/backend.log | sed 's/^/  /'
else
    echo "❌ Backend log not found"
fi
echo
EOF

chmod +x /opt/smart-lean-0dte/monitor.sh
print_success "Monitoring script created"

# Create backup script
print_status "Creating backup script..."
cat > /opt/smart-lean-0dte/backup.sh << 'EOF'
#!/bin/bash

# Smart-Lean-0DTE Backup Script

BACKUP_DIR="/opt/smart-lean-0dte/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting backup at $(date)"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up database..."
sudo -u postgres pg_dump smart_lean_0dte > $BACKUP_DIR/database_$DATE.sql

# Backup configuration
echo "Backing up configuration..."
cp -r /opt/smart-lean-0dte/config $BACKUP_DIR/config_$DATE

# Backup logs (last 7 days)
echo "Backing up recent logs..."
find /opt/smart-lean-0dte/logs -name "*.log" -mtime -7 -exec cp {} $BACKUP_DIR/ \;

# Compress backup
echo "Compressing backup..."
tar -czf $BACKUP_DIR/smart_lean_backup_$DATE.tar.gz -C $BACKUP_DIR database_$DATE.sql config_$DATE

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "smart_lean_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/smart_lean_backup_$DATE.tar.gz"
EOF

chmod +x /opt/smart-lean-0dte/backup.sh
print_success "Backup script created"

# Setup cron job for backups
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/smart-lean-0dte/backup.sh >> /opt/smart-lean-0dte/logs/backup.log 2>&1") | crontab -
print_success "Daily backup cron job created"

# Final system check
print_status "Performing final system check..."

# Check if all services are installed
SERVICES_OK=true

command -v docker >/dev/null 2>&1 || { print_error "Docker not found"; SERVICES_OK=false; }
command -v python3.11 >/dev/null 2>&1 || { print_error "Python 3.11 not found"; SERVICES_OK=false; }
command -v node >/dev/null 2>&1 || { print_error "Node.js not found"; SERVICES_OK=false; }
command -v psql >/dev/null 2>&1 || { print_error "PostgreSQL not found"; SERVICES_OK=false; }
command -v redis-server >/dev/null 2>&1 || { print_error "Redis not found"; SERVICES_OK=false; }
command -v nginx >/dev/null 2>&1 || { print_error "Nginx not found"; SERVICES_OK=false; }

if [ "$SERVICES_OK" = true ]; then
    print_success "All services installed successfully"
else
    print_error "Some services failed to install"
    exit 1
fi

# Display summary
echo
echo "=================================================================="
print_success "Stage 1: Infrastructure Setup Complete!"
echo "=================================================================="
echo
echo "✅ System packages updated"
echo "✅ Docker and Docker Compose installed"
echo "✅ Python 3.11 installed"
echo "✅ Node.js and npm installed"
echo "✅ PostgreSQL installed and configured"
echo "✅ Redis installed and configured"
echo "✅ Nginx installed and configured"
echo "✅ Firewall configured"
echo "✅ Application directories created"
echo "✅ Systemd services configured"
echo "✅ Monitoring and backup scripts created"
echo
echo "📁 Application directory: /opt/smart-lean-0dte"
echo "📝 Environment template: /opt/smart-lean-0dte/config/.env.template"
echo "📊 Monitor script: /opt/smart-lean-0dte/monitor.sh"
echo "💾 Backup script: /opt/smart-lean-0dte/backup.sh"
echo
print_warning "IMPORTANT: You may need to log out and back in for Docker group membership to take effect"
echo
print_status "Next step: Run deploy-cloud-2-backend.sh to deploy the backend services"
echo


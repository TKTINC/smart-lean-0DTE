#!/bin/bash

# Smart-Lean-0DTE Cloud Backend Deployment
# Stage 2: Backend Services and Database Setup

set -e  # Exit on any error

echo "🚀 Smart-Lean-0DTE Cloud Deployment - Stage 2: Backend Services"
echo "================================================================"

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

# Check if Stage 1 was completed
if [ ! -d "/opt/smart-lean-0dte" ]; then
    print_error "Stage 1 (Infrastructure) not completed. Please run deploy-cloud-1-infrastructure.sh first."
    exit 1
fi

# Copy application code to deployment directory
print_status "Copying application code..."
cp -r backend /opt/smart-lean-0dte/
cp -r simple-frontend /opt/smart-lean-0dte/
cp -r docs /opt/smart-lean-0dte/
print_success "Application code copied"

# Setup Python virtual environment
print_status "Setting up Python virtual environment..."
cd /opt/smart-lean-0dte/backend
python3 -m venv venv
source venv/bin/activate
print_success "Virtual environment created"

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install additional production dependencies
pip install \
    gunicorn \
    psycopg2-binary \
    redis \
    python-multipart \
    python-jose[cryptography] \
    passlib[bcrypt]

print_success "Python dependencies installed"

# Setup database
print_status "Setting up PostgreSQL database..."

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE smart_lean_0dte;
CREATE USER smart_lean WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE smart_lean_0dte TO smart_lean;
ALTER USER smart_lean CREATEDB;
\q
EOF

print_success "Database created"

# Create environment file
print_status "Creating environment configuration..."
cat > /opt/smart-lean-0dte/config/.env << EOF
# Smart-Lean-0DTE Production Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://smart_lean:$DB_PASSWORD@localhost:5432/smart_lean_0dte
REDIS_URL=redis://localhost:6379/0

# Databento Configuration (REPLACE WITH YOUR API KEY)
DATABENTO_API_KEY=YOUR_DATABENTO_API_KEY_HERE
DATABENTO_DATASET=OPRA.TRADES
DATABENTO_LIVE_GATEWAY=wss://live.databento.com/v0/live
DATABENTO_HIST_GATEWAY=https://hist.databento.com/v0/

# IBKR Configuration (CONFIGURE FOR YOUR SETUP)
IBKR_GATEWAY_HOST=localhost
IBKR_GATEWAY_PORT=4001
IBKR_CLIENT_ID=1
IBKR_ACCOUNT=YOUR_IBKR_ACCOUNT
IBKR_PAPER_TRADING=true

# Application Configuration
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=false
APP_SECRET_KEY=$(openssl rand -base64 32)

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

print_success "Environment configuration created"

# Initialize database tables
print_status "Initializing database tables..."
cd /opt/smart-lean-0dte/backend
source venv/bin/activate

# Create database initialization script
cat > init_db.py << 'EOF'
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add app directory to path
sys.path.append('/opt/smart-lean-0dte/backend')

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/opt/smart-lean-0dte/config/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

def create_tables():
    """Create database tables"""
    engine = create_engine(DATABASE_URL)
    
    # Create tables SQL
    tables_sql = """
    -- Positions table
    CREATE TABLE IF NOT EXISTS positions (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        option_type VARCHAR(4) NOT NULL,
        strike DECIMAL(10,2) NOT NULL,
        expiration DATE NOT NULL,
        quantity INTEGER NOT NULL,
        entry_price DECIMAL(10,4) NOT NULL,
        current_price DECIMAL(10,4),
        pnl DECIMAL(12,2),
        status VARCHAR(20) DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Signals table
    CREATE TABLE IF NOT EXISTS signals (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL,
        option_type VARCHAR(4) NOT NULL,
        strike DECIMAL(10,2) NOT NULL,
        strategy VARCHAR(50) NOT NULL,
        confidence DECIMAL(5,2) NOT NULL,
        entry_price DECIMAL(10,4) NOT NULL,
        target_price DECIMAL(10,4),
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP,
        pnl DECIMAL(12,2)
    );
    
    -- Analytics table
    CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        total_pnl DECIMAL(12,2),
        win_rate DECIMAL(5,2),
        total_trades INTEGER,
        successful_trades INTEGER,
        portfolio_value DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- System status table
    CREATE TABLE IF NOT EXISTS system_status (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        message TEXT,
        last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
    CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
    CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
    CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
    """
    
    with engine.connect() as conn:
        # Execute each statement separately
        for statement in tables_sql.split(';'):
            if statement.strip():
                conn.execute(text(statement))
        conn.commit()
    
    print("Database tables created successfully")

if __name__ == "__main__":
    create_tables()
EOF

python3 init_db.py
rm init_db.py
print_success "Database tables initialized"

# Create production startup script
print_status "Creating production startup script..."
cat > /opt/smart-lean-0dte/start_backend.sh << 'EOF'
#!/bin/bash

# Smart-Lean-0DTE Backend Startup Script

cd /opt/smart-lean-0dte/backend
source venv/bin/activate

# Load environment variables
export $(cat /opt/smart-lean-0dte/config/.env | grep -v '^#' | xargs)

# Start backend with Gunicorn for production
exec gunicorn app.main:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --access-logfile /opt/smart-lean-0dte/logs/access.log \
    --error-logfile /opt/smart-lean-0dte/logs/error.log \
    --log-level info \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 50
EOF

chmod +x /opt/smart-lean-0dte/start_backend.sh
print_success "Production startup script created"

# Update systemd service to use production script
print_status "Updating systemd service..."
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
ExecStart=/opt/smart-lean-0dte/start_backend.sh
Restart=always
RestartSec=10
StandardOutput=append:/opt/smart-lean-0dte/logs/backend.log
StandardError=append:/opt/smart-lean-0dte/logs/backend-error.log

# Environment
Environment=PYTHONPATH=/opt/smart-lean-0dte/backend
EnvironmentFile=/opt/smart-lean-0dte/config/.env

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/smart-lean-0dte

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
print_success "Systemd service updated"

# Install additional monitoring tools
print_status "Installing monitoring dependencies..."
pip install psutil prometheus-client
print_success "Monitoring dependencies installed"

# Create health check script
print_status "Creating health check script..."
cat > /opt/smart-lean-0dte/health_check.py << 'EOF'
#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

def check_backend_health():
    """Check backend API health"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend API: {data.get('status', 'OK')}")
            return True
        else:
            print(f"❌ Backend API: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend API: {str(e)}")
        return False

def check_database_connection():
    """Check database connectivity"""
    try:
        response = requests.get('http://localhost:8000/api/health/database', timeout=10)
        if response.status_code == 200:
            print("✅ Database: Connected")
            return True
        else:
            print("❌ Database: Connection failed")
            return False
    except Exception as e:
        print(f"❌ Database: {str(e)}")
        return False

def check_data_connections():
    """Check external data connections"""
    try:
        response = requests.get('http://localhost:8000/api/connections/status', timeout=10)
        if response.status_code == 200:
            data = response.json()
            for service, status in data.items():
                status_icon = "✅" if status.get('connected') else "❌"
                print(f"{status_icon} {service}: {status.get('message', 'Unknown')}")
            return True
        else:
            print("❌ Connection status check failed")
            return False
    except Exception as e:
        print(f"❌ Connection check: {str(e)}")
        return False

def main():
    print(f"Smart-Lean-0DTE Health Check - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    checks = [
        check_backend_health(),
        check_database_connection(),
        check_data_connections()
    ]
    
    if all(checks):
        print("\n🎉 All systems operational!")
        sys.exit(0)
    else:
        print("\n⚠️  Some systems have issues")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

chmod +x /opt/smart-lean-0dte/health_check.py
print_success "Health check script created"

# Test backend startup (dry run)
print_status "Testing backend configuration..."
cd /opt/smart-lean-0dte/backend
source venv/bin/activate

# Quick syntax check
python3 -c "
import sys
sys.path.append('/opt/smart-lean-0dte/backend')
try:
    from app.main import app
    print('✅ Backend code syntax OK')
except Exception as e:
    print(f'❌ Backend syntax error: {e}')
    sys.exit(1)
"

print_success "Backend configuration test passed"

# Create API documentation
print_status "Creating API documentation..."
cat > /opt/smart-lean-0dte/API_ENDPOINTS.md << 'EOF'
# Smart-Lean-0DTE API Endpoints

## Health Checks
- `GET /health` - Basic health check
- `GET /api/health/database` - Database connectivity
- `GET /api/connections/status` - External connections status

## Dashboard
- `GET /api/dashboard` - Dashboard metrics and data

## Trading
- `GET /api/positions` - Current positions
- `POST /api/positions/close/{position_id}` - Close position
- `GET /api/trading/status` - Trading system status
- `POST /api/trading/emergency_stop` - Emergency stop all trading

## Signals
- `GET /api/signals/realtime` - Current pending signals
- `GET /api/signals/history` - Historical signals
- `GET /api/signals/statistics` - Signal performance stats
- `POST /api/signals/execute` - Execute a signal
- `POST /api/signals/ignore` - Ignore a signal

## Analytics
- `GET /api/analytics/performance` - Performance metrics
- `GET /api/analytics/strategies` - Strategy breakdown
- `GET /api/analytics/risk` - Risk analysis

## Strikes
- `GET /api/strikes/chain` - Option chain data
- `GET /api/strikes/prices` - Historical price data
- `GET /api/strikes/greeks` - Greeks calculations

## Data Management
- `POST /api/data/reset` - Reset system data
- `GET /api/data/backup` - Create data backup
- `POST /api/data/restore` - Restore from backup

## Connections
- `GET /api/connections/databento` - Databento status
- `GET /api/connections/ibkr` - IBKR status
- `GET /api/ai/status` - AI engine status
EOF

print_success "API documentation created"

# Set proper permissions
print_status "Setting file permissions..."
sudo chown -R $USER:$USER /opt/smart-lean-0dte
chmod -R 755 /opt/smart-lean-0dte
chmod 600 /opt/smart-lean-0dte/config/.env
print_success "File permissions set"

# Display summary
echo
echo "================================================================"
print_success "Stage 2: Backend Deployment Complete!"
echo "================================================================"
echo
echo "✅ Application code deployed"
echo "✅ Python virtual environment created"
echo "✅ Dependencies installed"
echo "✅ PostgreSQL database configured"
echo "✅ Environment configuration created"
echo "✅ Database tables initialized"
echo "✅ Production startup script created"
echo "✅ Systemd service updated"
echo "✅ Health check script created"
echo "✅ API documentation generated"
echo
echo "📁 Backend location: /opt/smart-lean-0dte/backend"
echo "🔧 Environment file: /opt/smart-lean-0dte/config/.env"
echo "🚀 Startup script: /opt/smart-lean-0dte/start_backend.sh"
echo "🏥 Health check: /opt/smart-lean-0dte/health_check.py"
echo "📚 API docs: /opt/smart-lean-0dte/API_ENDPOINTS.md"
echo
print_warning "IMPORTANT CONFIGURATION REQUIRED:"
echo "1. Edit /opt/smart-lean-0dte/config/.env with your Databento API key"
echo "2. Configure IBKR settings in the environment file"
echo "3. Set IBKR_PAPER_TRADING=false for live trading (when ready)"
echo
print_status "To start the backend service:"
echo "  sudo systemctl start smart-lean-backend"
echo "  sudo systemctl enable smart-lean-backend"
echo
print_status "To check backend status:"
echo "  sudo systemctl status smart-lean-backend"
echo "  python3 /opt/smart-lean-0dte/health_check.py"
echo
print_status "Next step: Run deploy-cloud-3-frontend.sh to deploy the frontend"
echo


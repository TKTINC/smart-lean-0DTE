# Smart-Lean-0DTE Cloud Deployment Architecture

## Executive Summary

This document addresses the cloud deployment strategy for Smart-Lean-0DTE, including Databento and IBKR integration, connection architecture, and deployment methodology based on lessons learned from local deployment challenges.

---

## Answers to Key Questions

### 1. **System Automation Level**
✅ **Fully Automated**: The system operates autonomously without user intervention:
- **Data Feed**: Databento provides real-time market data automatically
- **Signal Generation**: AI engine continuously analyzes market conditions
- **Trade Execution**: IBKR integration executes trades automatically
- **Risk Management**: Automated position sizing and stop-loss execution
- **Self-Learning**: AI models adapt and improve continuously
- **No User Action Required**: System operates 24/7 during market hours

### 2. **Mock Data Transition**
✅ **Complete Replacement**: Once live data connections are established:
- All mock/test data will be permanently replaced
- System will exclusively use live market data from Databento
- No fallback to mock data to maintain data integrity
- Data quality monitoring ensures feed reliability
- **Critical**: Never revert to mock data once live feeds are active

### 3. **Strikes Page Data Flow**
✅ **Real-time Integration**: All sections will populate with live data:
- Strike chain table: Live bid/ask/volume/IV from Databento
- 2-minute charts: Real-time option price movements
- Greeks calculations: Live delta/gamma/theta/vega
- Performance metrics: Actual trading results
- Market data: Current underlying prices and volatility

### 4. **Data Reset Functionality**
✅ **Full Reset Capability**: Implemented comprehensive reset controls:
- **Selective Reset**: Positions, Signals, Analytics individually
- **Full System Reset**: Complete data wipe and fresh start
- **Use Cases**: Testing, data corruption recovery, fresh deployment
- **Safety**: Confirmation prompts and irreversible warnings
- **Location**: Dashboard page with prominent controls

---

## Cloud Deployment Architecture

### Infrastructure Requirements

#### **Cloud Platform**: AWS/Azure/GCP
- **Compute**: 2-4 vCPU, 8-16GB RAM minimum
- **Storage**: 100GB SSD for database and logs
- **Network**: Low-latency connection for market data
- **OS**: Ubuntu 22.04 LTS (consistent with local environment)

#### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Data Layer    │
│   (Static)      │    │   (FastAPI)     │    │   (Database)    │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │◄──►│ • Trading API   │◄──►│ • PostgreSQL    │
│ • Chart.js      │    │ • AI Engine     │    │ • Redis Cache   │
│ • Responsive    │    │ • Risk Mgmt     │    │ • File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │  Load Balancer  │    │   Monitoring    │
│   Hosting       │    │   (Optional)    │    │   & Logging     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Data Integration Architecture

### Databento Integration

#### **Connection Method**
- **Protocol**: HTTPS REST API + WebSocket for real-time data
- **Authentication**: API key-based authentication
- **Endpoint**: `https://hist.databento.com/v0/` (historical) + `wss://live.databento.com/v0/` (live)
- **Data Types**: Options chains, real-time quotes, trade data, Greeks

#### **Configuration**
```python
# Databento Configuration
DATABENTO_CONFIG = {
    "api_key": "YOUR_API_KEY",
    "dataset": "OPRA.TRADES",  # Options data
    "symbols": ["SPY", "QQQ", "IWM"],
    "schema": "trades",
    "live_gateway": "wss://live.databento.com/v0/live",
    "historical_gateway": "https://hist.databento.com/v0/"
}
```

#### **Data Flow**
1. **Market Data**: Real-time option quotes and trades
2. **Historical Data**: Backfill for AI model training
3. **Greeks Calculation**: Real-time delta, gamma, theta, vega
4. **Volume Analysis**: Trade volume and open interest

### IBKR Integration

#### **Connection Architecture**
⚠️ **Critical Cloud Consideration**: IBKR Gateway cannot use localhost in cloud environment

#### **Cloud Gateway Setup**
```python
# IBKR Cloud Configuration
IBKR_CONFIG = {
    "gateway_host": "0.0.0.0",  # Listen on all interfaces
    "gateway_port": 4001,       # TWS Gateway port
    "client_id": 1,             # Unique client identifier
    "account": "YOUR_ACCOUNT",  # IBKR account number
    "paper_trading": False      # Set to True for testing
}
```

#### **Gateway Deployment Options**

**Option 1: Cloud-Hosted Gateway**
- Deploy IBKR Gateway on same cloud instance
- Configure Gateway to accept external connections
- Use internal IP for backend communication
- Requires IBKR Gateway running 24/7

**Option 2: VPN Connection**
- Establish VPN between cloud and local Gateway
- Keep Gateway on local machine with stable connection
- Cloud backend connects via VPN tunnel
- More reliable for personal trading accounts

**Option 3: Dedicated Gateway Instance**
- Separate cloud instance running only IBKR Gateway
- Backend connects to Gateway instance via private network
- Scalable and isolated architecture
- Recommended for production deployment

#### **Connection Flow**
```
Cloud Backend ──► IBKR Gateway ──► IBKR Servers
     │                 │               │
     │                 │               │
   API Calls      TWS Protocol    Order Routing
   Portfolio      Market Data     Trade Execution
   Management     Account Info    Position Updates
```

---

## Deployment Strategy

### Lessons from Local Deployment

#### **Local Deployment Issues Identified**
1. **React Build Conflicts**: npm dependency hell with ajv package
2. **Single Script Failure**: deploy-local.sh couldn't handle complex dependencies
3. **Three Terminal Success**: Manual approach worked reliably

#### **Cloud Deployment Solution**

**Avoid Single-Script Deployment**: Based on local experience, implement multi-stage deployment:

```bash
# Stage 1: Infrastructure Setup
./deploy-cloud-1-infrastructure.sh

# Stage 2: Backend Deployment  
./deploy-cloud-2-backend.sh

# Stage 3: Frontend Deployment
./deploy-cloud-3-frontend.sh

# Stage 4: Data Integration
./deploy-cloud-4-integration.sh
```

#### **Multi-Stage Deployment Scripts**

**Stage 1: Infrastructure**
```bash
#!/bin/bash
# deploy-cloud-1-infrastructure.sh

echo "🚀 Stage 1: Setting up cloud infrastructure..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Python and Node.js
sudo apt install -y python3.11 python3-pip nodejs npm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Setup firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 8000  # Backend API
sudo ufw allow 4001  # IBKR Gateway
sudo ufw --force enable

echo "✅ Infrastructure setup complete"
```

**Stage 2: Backend Deployment**
```bash
#!/bin/bash
# deploy-cloud-2-backend.sh

echo "🚀 Stage 2: Deploying backend services..."

# Navigate to backend directory
cd backend

# Install Python dependencies
python3 -m pip install -r requirements.txt

# Setup database
sudo -u postgres createdb smart_lean_0dte
sudo -u postgres psql -c "CREATE USER smart_lean WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE smart_lean_0dte TO smart_lean;"

# Run database migrations
python3 -c "from app.database import create_tables; create_tables()"

# Start backend service
nohup python3 app/main.py > backend.log 2>&1 &

echo "✅ Backend deployment complete"
```

**Stage 3: Frontend Deployment**
```bash
#!/bin/bash
# deploy-cloud-3-frontend.sh

echo "🚀 Stage 3: Deploying frontend..."

# Use simple HTML frontend (avoid React issues)
cd simple-frontend

# Start simple HTTP server
nohup python3 -m http.server 80 > frontend.log 2>&1 &

# Alternative: Use nginx for production
# sudo apt install -y nginx
# sudo cp -r * /var/www/html/
# sudo systemctl start nginx
# sudo systemctl enable nginx

echo "✅ Frontend deployment complete"
```

**Stage 4: Data Integration**
```bash
#!/bin/bash
# deploy-cloud-4-integration.sh

echo "🚀 Stage 4: Setting up data integration..."

# Configure Databento
echo "Setting up Databento connection..."
# API key configuration handled in backend settings

# Setup IBKR Gateway (if cloud-hosted)
if [ "$IBKR_CLOUD_HOSTED" = "true" ]; then
    echo "Setting up IBKR Gateway..."
    # Download and configure IBKR Gateway
    # This requires manual setup with IBKR credentials
fi

# Test connections
python3 -c "
from app.services.market_data_service import test_databento_connection
from app.services.trading_service import test_ibkr_connection
test_databento_connection()
test_ibkr_connection()
"

echo "✅ Data integration setup complete"
```

### Production Deployment Checklist

#### **Pre-Deployment**
- [ ] Cloud instance provisioned and accessible
- [ ] Domain name configured (optional)
- [ ] SSL certificates obtained (for HTTPS)
- [ ] Databento API key obtained
- [ ] IBKR account configured and Gateway tested
- [ ] Database backup strategy implemented

#### **Deployment Steps**
1. [ ] Run Stage 1: Infrastructure setup
2. [ ] Run Stage 2: Backend deployment
3. [ ] Run Stage 3: Frontend deployment  
4. [ ] Run Stage 4: Data integration
5. [ ] Verify all services running
6. [ ] Test data connections
7. [ ] Validate trading functionality (paper trading first)

#### **Post-Deployment**
- [ ] Monitor system logs
- [ ] Verify connection status indicators
- [ ] Test data reset functionality
- [ ] Confirm autonomous trading operation
- [ ] Setup monitoring and alerting

---

## Connection Status Monitoring

### Dashboard Integration

The enhanced dashboard now includes comprehensive connection monitoring:

#### **Status Indicators**
- **Databento Feed**: Real-time market data connection
- **IBKR Gateway**: Trading execution connection  
- **AI Engine**: Signal generation system status
- **Market Hours**: Current trading session status
- **System Status**: Overall operational health

#### **Status Colors**
- 🟢 **Green**: Connected and operational
- 🟡 **Yellow**: Warning or degraded performance
- 🔴 **Red**: Disconnected or error state
- ⚪ **Gray**: Inactive or unknown status

#### **Automatic Monitoring**
- Connection checks every 10 seconds
- Automatic reconnection attempts
- Alert notifications for failures
- Historical uptime tracking

---

## Security Considerations

### API Key Management
- Store Databento API key in environment variables
- Use cloud key management services (AWS KMS, Azure Key Vault)
- Rotate keys regularly
- Monitor API usage and rate limits

### IBKR Security
- Use dedicated trading account for automation
- Enable two-factor authentication
- Set appropriate position and risk limits
- Monitor account activity regularly

### Network Security
- Use HTTPS for all web traffic
- Secure WebSocket connections (WSS)
- Implement rate limiting on API endpoints
- Regular security updates and patches

---

## Monitoring and Maintenance

### System Monitoring
- **Application Logs**: Centralized logging with rotation
- **Performance Metrics**: CPU, memory, disk usage
- **Connection Health**: Data feed and broker connectivity
- **Trading Activity**: Position changes and P&L tracking

### Alerting
- **Connection Failures**: Immediate notification
- **Trading Errors**: Failed order execution alerts
- **Performance Issues**: High latency or errors
- **Security Events**: Unauthorized access attempts

### Backup Strategy
- **Database Backups**: Daily automated backups
- **Configuration Backups**: System settings and API keys
- **Code Backups**: Git repository with cloud sync
- **Recovery Testing**: Regular restore procedures

This comprehensive cloud deployment architecture ensures reliable, secure, and scalable operation of the Smart-Lean-0DTE system with full autonomous trading capabilities.


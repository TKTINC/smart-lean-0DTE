# IBKR Gateway Dedicated Instance Architecture

## Multi-Application Gateway Support for Smart-Lean-0DTE

This document details the implementation of Option 3: Dedicated IBKR Gateway Instance with support for multiple trading applications.

---

## Architecture Overview

### ❓ **Your Question**: "Can other applications talk to this gateway too?"

### ✅ **Answer**: **YES! Multiple applications can connect to the same IBKR Gateway**

```
┌─────────────────────────────────────────────────────────────────┐
│                    IBKR Gateway Instance                        │
│                     (t3.small - Private)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   TWS Gateway   │    │  IB Controller  │                    │
│  │   Port 4001     │    │   Port 7496     │                    │
│  │   (Paper)       │    │   (Live)        │                    │
│  └─────────────────┘    └─────────────────┘                    │
│           │                       │                             │
│           └───────────┬───────────┘                             │
│                       │                                         │
│              ┌─────────────────┐                                │
│              │  Load Balancer  │                                │
│              │  (HAProxy/Nginx)│                                │
│              └─────────────────┘                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
│Smart-Lean-0DTE│ │ App #2  │ │   App #3    │
│   (Main)      │ │(Python) │ │ (Any Lang)  │
│ Client ID: 1  │ │Client:2 │ │ Client: 3   │
└───────────────┘ └─────────┘ └─────────────┘
```

### **Multi-Application Benefits**:
✅ **Shared Gateway**: One IBKR Gateway serves multiple applications
✅ **Cost Efficient**: Single instance for all trading apps
✅ **Centralized Management**: One place to manage IBKR connection
✅ **Load Distribution**: Multiple client connections supported
✅ **Isolation**: Each app uses unique client ID

---

## Gateway Instance Setup

### Step 1: IBKR Gateway Installation Script
```bash
#!/bin/bash
# deploy-ibkr-gateway.sh - Run on dedicated IBKR instance

echo "🚀 Setting up IBKR Gateway Instance"

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java (required for TWS Gateway)
sudo apt install -y openjdk-11-jdk

# Install X11 for headless operation
sudo apt install -y xvfb x11vnc

# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Create IBKR user
sudo useradd -m -s /bin/bash ibkr
sudo usermod -aG sudo ibkr

# Create directories
sudo mkdir -p /opt/ibkr/{gateway,logs,config,scripts}
sudo chown -R ibkr:ibkr /opt/ibkr

# Download TWS Gateway (replace with actual download)
cd /opt/ibkr/gateway
wget "https://download2.interactivebrokers.com/installers/tws/latest-standalone/tws-latest-standalone-linux-x64.sh"
chmod +x tws-latest-standalone-linux-x64.sh

# Install TWS Gateway
sudo -u ibkr ./tws-latest-standalone-linux-x64.sh -q

echo "✅ IBKR Gateway base installation complete"
```

### Step 2: Gateway Configuration
```bash
# /opt/ibkr/config/gateway.conf

# TWS Gateway Configuration
gateway.host=0.0.0.0
gateway.port.paper=4001
gateway.port.live=4002
gateway.readonly=false
gateway.useRemoteSettings=false

# Connection limits
max.connections=10
connection.timeout=30

# Logging
log.level=INFO
log.file=/opt/ibkr/logs/gateway.log
log.rotation=daily
log.retention=30

# Security
allowed.ips=10.0.0.0/16
api.authentication=true
```

### Step 3: Multi-Client Load Balancer
```nginx
# /etc/nginx/sites-available/ibkr-gateway
# Load balancer for multiple client connections

upstream ibkr_paper {
    server 127.0.0.1:4001 max_fails=3 fail_timeout=30s;
}

upstream ibkr_live {
    server 127.0.0.1:4002 max_fails=3 fail_timeout=30s;
}

server {
    listen 4001;
    
    location / {
        proxy_pass http://ibkr_paper;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Connection pooling
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

server {
    listen 4002;
    
    location / {
        proxy_pass http://ibkr_live;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Connection pooling
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## Multi-Application Client Configuration

### Application 1: Smart-Lean-0DTE
```python
# Smart-Lean-0DTE IBKR Configuration
IBKR_CONFIG = {
    "gateway_host": "10.0.2.100",  # Private IP of gateway instance
    "gateway_port_paper": 4001,
    "gateway_port_live": 4002,
    "client_id": 1,                # Unique client ID
    "account": "YOUR_ACCOUNT",
    "app_name": "Smart-Lean-0DTE"
}
```

### Application 2: Custom Python App
```python
# Custom Trading App Configuration
IBKR_CONFIG = {
    "gateway_host": "10.0.2.100",  # Same gateway instance
    "gateway_port_paper": 4001,
    "gateway_port_live": 4002,
    "client_id": 2,                # Different client ID
    "account": "YOUR_ACCOUNT",
    "app_name": "Custom-Trader"
}
```

### Application 3: Any Language/Framework
```javascript
// Node.js Example
const ibkrConfig = {
    gatewayHost: "10.0.2.100",    // Same gateway instance
    gatewayPortPaper: 4001,
    gatewayPortLive: 4002,
    clientId: 3,                  // Unique client ID
    account: "YOUR_ACCOUNT",
    appName: "NodeJS-Trader"
};
```

---

## Gateway Management Scripts

### Start Gateway Script
```bash
#!/bin/bash
# /opt/ibkr/scripts/start_gateway.sh

echo "Starting IBKR Gateway..."

# Start X11 virtual display
export DISPLAY=:1
Xvfb :1 -screen 0 1024x768x24 &
XVFB_PID=$!

# Start TWS Gateway in headless mode
cd /opt/ibkr/gateway
java -cp "tws-api.jar:." \
    -Xmx1024m \
    -Djava.awt.headless=true \
    -Duser.timezone=America/New_York \
    com.ib.controller.ApiController \
    --gateway-port-paper=4001 \
    --gateway-port-live=4002 \
    --host=0.0.0.0 \
    --readonly=false &

GATEWAY_PID=$!

# Save PIDs for cleanup
echo $XVFB_PID > /opt/ibkr/logs/xvfb.pid
echo $GATEWAY_PID > /opt/ibkr/logs/gateway.pid

echo "Gateway started with PID: $GATEWAY_PID"
echo "X11 started with PID: $XVFB_PID"
```

### Stop Gateway Script
```bash
#!/bin/bash
# /opt/ibkr/scripts/stop_gateway.sh

echo "Stopping IBKR Gateway..."

# Stop gateway
if [ -f /opt/ibkr/logs/gateway.pid ]; then
    GATEWAY_PID=$(cat /opt/ibkr/logs/gateway.pid)
    kill $GATEWAY_PID
    rm /opt/ibkr/logs/gateway.pid
fi

# Stop X11
if [ -f /opt/ibkr/logs/xvfb.pid ]; then
    XVFB_PID=$(cat /opt/ibkr/logs/xvfb.pid)
    kill $XVFB_PID
    rm /opt/ibkr/logs/xvfb.pid
fi

echo "Gateway stopped"
```

### Health Check Script
```bash
#!/bin/bash
# /opt/ibkr/scripts/health_check.sh

echo "IBKR Gateway Health Check"
echo "========================"

# Check if gateway process is running
if pgrep -f "ApiController" > /dev/null; then
    echo "✅ Gateway Process: Running"
else
    echo "❌ Gateway Process: Not running"
fi

# Check if ports are listening
if netstat -tuln | grep -q ":4001 "; then
    echo "✅ Paper Trading Port (4001): Listening"
else
    echo "❌ Paper Trading Port (4001): Not listening"
fi

if netstat -tuln | grep -q ":4002 "; then
    echo "✅ Live Trading Port (4002): Listening"
else
    echo "❌ Live Trading Port (4002): Not listening"
fi

# Check client connections
CONNECTIONS=$(netstat -an | grep -E ":(4001|4002)" | grep ESTABLISHED | wc -l)
echo "📊 Active Connections: $CONNECTIONS"

# Check log for errors
if [ -f /opt/ibkr/logs/gateway.log ]; then
    ERRORS=$(tail -100 /opt/ibkr/logs/gateway.log | grep -i error | wc -l)
    if [ $ERRORS -eq 0 ]; then
        echo "✅ Recent Errors: None"
    else
        echo "⚠️  Recent Errors: $ERRORS (check logs)"
    fi
fi
```

---

## Systemd Service Configuration

### Gateway Service
```ini
# /etc/systemd/system/ibkr-gateway.service

[Unit]
Description=IBKR Gateway Service
After=network.target
Wants=network.target

[Service]
Type=forking
User=ibkr
Group=ibkr
WorkingDirectory=/opt/ibkr/gateway
ExecStart=/opt/ibkr/scripts/start_gateway.sh
ExecStop=/opt/ibkr/scripts/stop_gateway.sh
Restart=always
RestartSec=30
StandardOutput=append:/opt/ibkr/logs/service.log
StandardError=append:/opt/ibkr/logs/service-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/ibkr

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable ibkr-gateway
sudo systemctl start ibkr-gateway
sudo systemctl status ibkr-gateway
```

---

## Client Connection Examples

### Smart-Lean-0DTE Connection
```python
# In Smart-Lean-0DTE backend
from ib_insync import IB, util

class IBKRConnection:
    def __init__(self):
        self.ib = IB()
        self.gateway_host = "10.0.2.100"  # Gateway private IP
        self.client_id = 1
        
    def connect_paper(self):
        """Connect to paper trading"""
        self.ib.connect(
            host=self.gateway_host,
            port=4001,
            clientId=self.client_id,
            timeout=20
        )
        
    def connect_live(self):
        """Connect to live trading"""
        self.ib.connect(
            host=self.gateway_host,
            port=4002,
            clientId=self.client_id,
            timeout=20
        )
```

### Multiple Application Management
```python
# Gateway connection manager
class GatewayManager:
    def __init__(self):
        self.connections = {}
        self.gateway_host = "10.0.2.100"
        
    def register_application(self, app_name, client_id):
        """Register a new application"""
        self.connections[app_name] = {
            "client_id": client_id,
            "status": "disconnected",
            "last_seen": None
        }
        
    def get_connection_status(self):
        """Get status of all connected applications"""
        return {
            app: {
                "client_id": info["client_id"],
                "status": info["status"],
                "last_seen": info["last_seen"]
            }
            for app, info in self.connections.items()
        }
```

---

## Monitoring and Maintenance

### Connection Monitoring
```bash
#!/bin/bash
# Monitor all client connections

echo "IBKR Gateway Connection Monitor"
echo "=============================="

# Show all connections by port
echo "Paper Trading Connections (4001):"
netstat -an | grep ":4001" | grep ESTABLISHED | while read line; do
    echo "  $line"
done

echo "Live Trading Connections (4002):"
netstat -an | grep ":4002" | grep ESTABLISHED | while read line; do
    echo "  $line"
done

# Show resource usage
echo "Resource Usage:"
echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "  Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "  Disk: $(df -h /opt/ibkr | awk 'NR==2{printf "%s", $5}')"
```

### Log Rotation
```bash
# /etc/logrotate.d/ibkr-gateway
/opt/ibkr/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ibkr ibkr
    postrotate
        systemctl reload ibkr-gateway || true
    endscript
}
```

---

## Security Considerations

### Network Security
- Gateway instance in private subnet (no direct internet access)
- Security group restricts access to specific applications
- VPN or bastion host for administrative access
- Encrypted communication between applications and gateway

### Access Control
- Dedicated `ibkr` user for gateway process
- Restricted file permissions on configuration files
- Client ID isolation prevents application interference
- Connection limits prevent resource exhaustion

### Monitoring
- Real-time connection monitoring
- Error logging and alerting
- Resource usage tracking
- Automated health checks

---

## Benefits of Dedicated Gateway Architecture

### ✅ **Multi-Application Support**
- **Shared Resource**: One gateway serves multiple trading applications
- **Cost Efficient**: Single instance instead of multiple gateways
- **Centralized Management**: One place to configure IBKR settings
- **Scalable**: Easy to add new applications

### ✅ **Reliability**
- **Dedicated Resources**: Gateway not affected by application issues
- **High Availability**: Automatic restart and monitoring
- **Load Balancing**: Distribute connections across multiple ports
- **Fault Isolation**: Application failures don't affect gateway

### ✅ **Security**
- **Network Isolation**: Private subnet with controlled access
- **Client Separation**: Each application uses unique client ID
- **Access Control**: Security groups limit connectivity
- **Audit Trail**: Comprehensive logging of all connections

### ✅ **Maintenance**
- **Centralized Updates**: Update gateway once for all applications
- **Monitoring**: Single point for connection health monitoring
- **Backup**: Simplified backup and recovery procedures
- **Scaling**: Easy to upgrade instance size if needed

This architecture provides a robust, scalable foundation for multiple trading applications to share a single IBKR Gateway instance while maintaining security and isolation.


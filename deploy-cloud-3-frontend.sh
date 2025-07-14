#!/bin/bash

# Smart-Lean-0DTE Cloud Frontend Deployment
# Stage 3: Frontend Services

set -e  # Exit on any error

echo "🚀 Smart-Lean-0DTE Cloud Deployment - Stage 3: Frontend Services"
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

# Check if previous stages completed
if [ ! -d "/opt/smart-lean-0dte/backend" ]; then
    print_error "Stage 2 (Backend) not completed. Please run deploy-cloud-2-backend.sh first."
    exit 1
fi

# Setup frontend directory
print_status "Setting up frontend deployment..."
cd /opt/smart-lean-0dte

# Copy simple frontend if not already there
if [ ! -d "simple-frontend" ]; then
    print_error "Simple frontend directory not found. Please ensure repository is properly cloned."
    exit 1
fi

print_success "Frontend files located"

# Configure Nginx for production
print_status "Configuring Nginx for production frontend..."

# Create Nginx site configuration
sudo tee /etc/nginx/sites-available/smart-lean-frontend > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    
    server_name _;
    root /opt/smart-lean-0dte/simple-frontend;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Main location
    location / {
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length 0;
            return 204;
        }
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/smart-lean-frontend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    print_success "Nginx configuration valid"
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Set proper permissions for frontend files
print_status "Setting frontend file permissions..."
sudo chown -R www-data:www-data /opt/smart-lean-0dte/simple-frontend
sudo chmod -R 755 /opt/smart-lean-0dte/simple-frontend

# Update frontend configuration for production
print_status "Updating frontend configuration for production..."

# Create production configuration file
cat > /opt/smart-lean-0dte/simple-frontend/config.js << 'EOF'
// Production configuration for Smart-Lean-0DTE Frontend

window.SMART_LEAN_CONFIG = {
    // API Configuration
    API_BASE_URL: '/api',
    
    // Environment
    ENVIRONMENT: 'production',
    
    // Update intervals (milliseconds)
    DASHBOARD_UPDATE_INTERVAL: 30000,      // 30 seconds
    CONNECTION_CHECK_INTERVAL: 10000,      // 10 seconds
    POSITIONS_UPDATE_INTERVAL: 15000,      // 15 seconds
    SIGNALS_UPDATE_INTERVAL: 5000,         // 5 seconds
    STRIKES_UPDATE_INTERVAL: 30000,        // 30 seconds
    
    // Chart configuration
    CHART_ANIMATION: true,
    CHART_RESPONSIVE: true,
    
    // Connection timeouts
    API_TIMEOUT: 10000,                    // 10 seconds
    
    // Features
    ENABLE_NOTIFICATIONS: true,
    ENABLE_SOUND_ALERTS: false,
    ENABLE_AUTO_REFRESH: true,
    
    // Debug
    DEBUG_MODE: false,
    CONSOLE_LOGGING: false
};
EOF

# Add configuration script to all HTML pages
print_status "Adding production configuration to HTML pages..."

for html_file in /opt/smart-lean-0dte/simple-frontend/*.html; do
    if [ -f "$html_file" ]; then
        # Check if config.js is already included
        if ! grep -q "config.js" "$html_file"; then
            # Add config.js before other scripts
            sed -i 's|<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>|<script src="config.js"></script>\n    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>|' "$html_file"
        fi
    fi
done

# Create frontend startup script
print_status "Creating frontend startup script..."
cat > /opt/smart-lean-0dte/start_frontend.sh << 'EOF'
#!/bin/bash

# Smart-Lean-0DTE Frontend Startup Script

echo "Starting Smart-Lean-0DTE Frontend..."

# Reload Nginx configuration
sudo nginx -s reload

# Check if Nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Starting Nginx..."
    sudo systemctl start nginx
fi

# Enable Nginx to start on boot
sudo systemctl enable nginx

echo "Frontend started successfully"
echo "Access the application at: http://$(curl -s ifconfig.me)"
EOF

chmod +x /opt/smart-lean-0dte/start_frontend.sh

# Update systemd service for frontend
print_status "Updating systemd service for frontend..."
sudo tee /etc/systemd/system/smart-lean-frontend.service > /dev/null <<EOF
[Unit]
Description=Smart-Lean-0DTE Frontend Service
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/smart-lean-0dte/start_frontend.sh
ExecReload=/usr/sbin/nginx -s reload
StandardOutput=append:/opt/smart-lean-0dte/logs/frontend.log
StandardError=append:/opt/smart-lean-0dte/logs/frontend-error.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

# Start and enable services
print_status "Starting frontend services..."
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo systemctl start smart-lean-frontend
sudo systemctl enable smart-lean-frontend

# Verify services are running
print_status "Verifying services..."

if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start"
    sudo systemctl status nginx
    exit 1
fi

if systemctl is-active --quiet smart-lean-frontend; then
    print_success "Frontend service is running"
else
    print_warning "Frontend service status unclear (this is normal for oneshot services)"
fi

# Test frontend accessibility
print_status "Testing frontend accessibility..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200"; then
    print_success "Frontend is accessible on port 80"
else
    print_warning "Frontend accessibility test failed - check Nginx logs"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    print_success "Frontend health check endpoint working"
else
    print_warning "Frontend health check failed"
fi

# Create frontend monitoring script
print_status "Creating frontend monitoring script..."
cat > /opt/smart-lean-0dte/monitor_frontend.sh << 'EOF'
#!/bin/bash

# Smart-Lean-0DTE Frontend Monitor

echo "Frontend Service Monitor"
echo "======================="

# Check Nginx status
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Stopped"
fi

# Check if port 80 is listening
if netstat -tuln | grep -q ":80 "; then
    echo "✅ Port 80: Listening"
else
    echo "❌ Port 80: Not listening"
fi

# Check frontend accessibility
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend: Accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Frontend: Not accessible (HTTP $HTTP_CODE)"
fi

# Check API proxy
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "✅ API Proxy: Working (HTTP $API_CODE)"
else
    echo "❌ API Proxy: Failed (HTTP $API_CODE)"
fi

# Check disk space for logs
DISK_USAGE=$(df /opt/smart-lean-0dte | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✅ Disk Space: ${DISK_USAGE}% used"
else
    echo "⚠️  Disk Space: ${DISK_USAGE}% used (consider cleanup)"
fi

# Check recent errors in Nginx logs
ERROR_COUNT=$(sudo tail -100 /var/log/nginx/error.log 2>/dev/null | grep -c "$(date '+%Y/%m/%d')" || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo "✅ Recent Errors: None"
else
    echo "⚠️  Recent Errors: $ERROR_COUNT (check Nginx logs)"
fi
EOF

chmod +x /opt/smart-lean-0dte/monitor_frontend.sh

# Create log rotation for Nginx
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/smart-lean-frontend > /dev/null <<EOF
/opt/smart-lean-0dte/logs/frontend*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload smart-lean-frontend || true
    endscript
}
EOF

# Display access information
print_status "Getting public IP address..."
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to determine")

# Display summary
echo
echo "================================================================"
print_success "Stage 3: Frontend Deployment Complete!"
echo "================================================================"
echo
echo "✅ Nginx configured and running"
echo "✅ Frontend files deployed"
echo "✅ Production configuration applied"
echo "✅ API proxy configured"
echo "✅ Security headers enabled"
echo "✅ Gzip compression enabled"
echo "✅ Systemd services configured"
echo "✅ Monitoring script created"
echo "✅ Log rotation configured"
echo
echo "🌐 Frontend Access Information:"
echo "   Public URL: http://$PUBLIC_IP"
echo "   Local URL: http://localhost"
echo "   Health Check: http://$PUBLIC_IP/health"
echo
echo "📁 Frontend location: /opt/smart-lean-0dte/simple-frontend"
echo "🔧 Nginx config: /etc/nginx/sites-available/smart-lean-frontend"
echo "🚀 Startup script: /opt/smart-lean-0dte/start_frontend.sh"
echo "📊 Monitor script: /opt/smart-lean-0dte/monitor_frontend.sh"
echo
print_status "To check frontend status:"
echo "  sudo systemctl status nginx"
echo "  /opt/smart-lean-0dte/monitor_frontend.sh"
echo
print_status "To view logs:"
echo "  sudo tail -f /var/log/nginx/access.log"
echo "  sudo tail -f /var/log/nginx/error.log"
echo
print_status "Next step: Run deploy-cloud-4-integration.sh to setup data connections"
echo


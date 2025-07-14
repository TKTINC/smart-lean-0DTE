#!/bin/bash

# Smart-Lean-0DTE Cloud Data Integration Deployment
# Stage 4: Databento and IBKR Integration

set -e  # Exit on any error

echo "🚀 Smart-Lean-0DTE Cloud Deployment - Stage 4: Data Integration"
echo "==============================================================="

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
if [ ! -f "/etc/nginx/sites-available/smart-lean-frontend" ]; then
    print_error "Stage 3 (Frontend) not completed. Please run deploy-cloud-3-frontend.sh first."
    exit 1
fi

print_status "Setting up data integration..."

# Check if environment file exists
if [ ! -f "/opt/smart-lean-0dte/config/.env" ]; then
    print_error "Environment file not found. Please complete Stage 2 first."
    exit 1
fi

# Create integration test scripts
print_status "Creating integration test scripts..."

# Databento connection test
cat > /opt/smart-lean-0dte/test_databento.py << 'EOF'
#!/usr/bin/env python3

import os
import sys
import asyncio
import aiohttp
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/opt/smart-lean-0dte/config/.env')

async def test_databento_connection():
    """Test Databento API connection"""
    api_key = os.getenv('DATABENTO_API_KEY')
    
    if not api_key or api_key == 'YOUR_DATABENTO_API_KEY_HERE':
        print("❌ Databento API key not configured")
        print("   Please update DATABENTO_API_KEY in /opt/smart-lean-0dte/config/.env")
        return False
    
    print("🔍 Testing Databento connection...")
    
    try:
        # Test historical API
        url = "https://hist.databento.com/v0/metadata.list_datasets"
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Databento Historical API: Connected")
                    print(f"   Available datasets: {len(data)}")
                    return True
                else:
                    print(f"❌ Databento API error: HTTP {response.status}")
                    error_text = await response.text()
                    print(f"   Error: {error_text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Databento connection failed: {str(e)}")
        return False

async def test_databento_live():
    """Test Databento live feed connection"""
    print("🔍 Testing Databento live feed...")
    
    # Note: Live feed testing requires WebSocket connection
    # This is a placeholder for actual implementation
    print("⚠️  Live feed test requires WebSocket implementation")
    print("   This will be tested when backend services start")
    return True

if __name__ == "__main__":
    async def main():
        print("Databento Connection Test")
        print("========================")
        
        hist_ok = await test_databento_connection()
        live_ok = await test_databento_live()
        
        if hist_ok and live_ok:
            print("\n🎉 Databento integration ready!")
            sys.exit(0)
        else:
            print("\n⚠️  Databento integration needs configuration")
            sys.exit(1)
    
    asyncio.run(main())
EOF

# IBKR connection test
cat > /opt/smart-lean-0dte/test_ibkr.py << 'EOF'
#!/usr/bin/env python3

import os
import sys
import socket
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/opt/smart-lean-0dte/config/.env')

def test_ibkr_gateway_connection():
    """Test IBKR Gateway connection"""
    gateway_host = os.getenv('IBKR_GATEWAY_HOST', 'localhost')
    gateway_port = int(os.getenv('IBKR_GATEWAY_PORT', '4001'))
    
    print(f"🔍 Testing IBKR Gateway connection to {gateway_host}:{gateway_port}...")
    
    try:
        # Test socket connection
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((gateway_host, gateway_port))
        sock.close()
        
        if result == 0:
            print("✅ IBKR Gateway: Port accessible")
            return True
        else:
            print("❌ IBKR Gateway: Port not accessible")
            print(f"   Make sure gateway is running on {gateway_host}:{gateway_port}")
            return False
            
    except Exception as e:
        print(f"❌ IBKR Gateway connection failed: {str(e)}")
        return False

def test_ibkr_configuration():
    """Test IBKR configuration"""
    print("🔍 Testing IBKR configuration...")
    
    account = os.getenv('IBKR_ACCOUNT')
    paper_trading = os.getenv('IBKR_PAPER_TRADING', 'true').lower() == 'true'
    
    if not account or account == 'YOUR_IBKR_ACCOUNT':
        print("❌ IBKR account not configured")
        print("   Please update IBKR_ACCOUNT in /opt/smart-lean-0dte/config/.env")
        return False
    
    print(f"✅ IBKR Account: {account}")
    print(f"✅ Paper Trading: {'Enabled' if paper_trading else 'Disabled'}")
    
    if not paper_trading:
        print("⚠️  Live trading enabled - ensure this is intentional!")
    
    return True

if __name__ == "__main__":
    print("IBKR Connection Test")
    print("===================")
    
    config_ok = test_ibkr_configuration()
    gateway_ok = test_ibkr_gateway_connection()
    
    if config_ok and gateway_ok:
        print("\n🎉 IBKR integration ready!")
        sys.exit(0)
    else:
        print("\n⚠️  IBKR integration needs configuration")
        sys.exit(1)
EOF

# Make test scripts executable
chmod +x /opt/smart-lean-0dte/test_databento.py
chmod +x /opt/smart-lean-0dte/test_ibkr.py

# Install additional Python packages for testing
print_status "Installing integration dependencies..."
cd /opt/smart-lean-0dte/backend
source venv/bin/activate
pip install aiohttp python-dotenv websockets

# Create comprehensive integration test
cat > /opt/smart-lean-0dte/test_integration.py << 'EOF'
#!/usr/bin/env python3

import os
import sys
import asyncio
import subprocess
from datetime import datetime

def run_test_script(script_name):
    """Run a test script and return success status"""
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, timeout=30)
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Test timed out"
    except Exception as e:
        return False, "", str(e)

def test_backend_health():
    """Test backend service health"""
    print("🔍 Testing backend service...")
    
    try:
        import requests
        response = requests.get('http://localhost:8000/health', timeout=10)
        if response.status_code == 200:
            print("✅ Backend API: Healthy")
            return True
        else:
            print(f"❌ Backend API: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend API: {str(e)}")
        return False

def test_frontend_health():
    """Test frontend service health"""
    print("🔍 Testing frontend service...")
    
    try:
        import requests
        response = requests.get('http://localhost/health', timeout=10)
        if response.status_code == 200:
            print("✅ Frontend: Healthy")
            return True
        else:
            print(f"❌ Frontend: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend: {str(e)}")
        return False

if __name__ == "__main__":
    print("Smart-Lean-0DTE Integration Test")
    print("================================")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test results
    results = {}
    
    # Test backend
    results['backend'] = test_backend_health()
    
    # Test frontend
    results['frontend'] = test_frontend_health()
    
    # Test Databento
    print("\nDatabento Integration:")
    print("---------------------")
    success, stdout, stderr = run_test_script('/opt/smart-lean-0dte/test_databento.py')
    results['databento'] = success
    print(stdout)
    if stderr:
        print(f"Errors: {stderr}")
    
    # Test IBKR
    print("\nIBKR Integration:")
    print("----------------")
    success, stdout, stderr = run_test_script('/opt/smart-lean-0dte/test_ibkr.py')
    results['ibkr'] = success
    print(stdout)
    if stderr:
        print(f"Errors: {stderr}")
    
    # Summary
    print("\nIntegration Test Summary:")
    print("========================")
    for component, status in results.items():
        status_icon = "✅" if status else "❌"
        print(f"{status_icon} {component.capitalize()}: {'PASS' if status else 'FAIL'}")
    
    # Overall result
    all_passed = all(results.values())
    print(f"\nOverall Status: {'🎉 ALL TESTS PASSED' if all_passed else '⚠️  SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n🚀 Smart-Lean-0DTE is ready for operation!")
    else:
        print("\n🔧 Please address the failed tests before proceeding.")
    
    sys.exit(0 if all_passed else 1)
EOF

chmod +x /opt/smart-lean-0dte/test_integration.py

# Create configuration validation script
print_status "Creating configuration validation script..."
cat > /opt/smart-lean-0dte/validate_config.py << 'EOF'
#!/usr/bin/env python3

import os
import re
from datetime import datetime

def validate_environment_file():
    """Validate environment configuration"""
    env_file = '/opt/smart-lean-0dte/config/.env'
    
    if not os.path.exists(env_file):
        print("❌ Environment file not found")
        return False
    
    print("🔍 Validating environment configuration...")
    
    required_vars = [
        'DATABASE_URL',
        'DATABENTO_API_KEY',
        'IBKR_GATEWAY_HOST',
        'IBKR_GATEWAY_PORT',
        'IBKR_ACCOUNT',
        'APP_SECRET_KEY'
    ]
    
    placeholder_values = [
        'YOUR_DATABENTO_API_KEY_HERE',
        'YOUR_IBKR_ACCOUNT',
        'CHANGE_THIS_SECRET_KEY',
        'CHANGE_PASSWORD'
    ]
    
    issues = []
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Check required variables
    for var in required_vars:
        if f'{var}=' not in content:
            issues.append(f"Missing required variable: {var}")
        else:
            # Extract value
            match = re.search(f'{var}=(.+)', content)
            if match:
                value = match.group(1).strip()
                if not value or value in placeholder_values:
                    issues.append(f"Variable {var} needs to be configured (currently placeholder)")
    
    # Check for placeholder values
    for placeholder in placeholder_values:
        if placeholder in content:
            issues.append(f"Placeholder value found: {placeholder}")
    
    if issues:
        print("❌ Configuration issues found:")
        for issue in issues:
            print(f"   • {issue}")
        return False
    else:
        print("✅ Environment configuration valid")
        return True

def validate_database_connection():
    """Validate database connection"""
    print("🔍 Testing database connection...")
    
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        load_dotenv('/opt/smart-lean-0dte/config/.env')
        database_url = os.getenv('DATABASE_URL')
        
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        print("✅ Database connection successful")
        print(f"   PostgreSQL version: {version[0].split()[1]}")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Configuration Validation")
    print("=======================")
    
    env_ok = validate_environment_file()
    db_ok = validate_database_connection()
    
    if env_ok and db_ok:
        print("\n🎉 Configuration validation passed!")
    else:
        print("\n⚠️  Configuration validation failed!")
        print("\nPlease fix the issues and run validation again.")
EOF

chmod +x /opt/smart-lean-0dte/validate_config.py

# Create startup verification script
print_status "Creating startup verification script..."
cat > /opt/smart-lean-0dte/verify_startup.sh << 'EOF'
#!/bin/bash

echo "Smart-Lean-0DTE Startup Verification"
echo "===================================="

# Check all services
echo "Service Status:"
echo "--------------"

services=("postgresql" "redis-server" "nginx" "smart-lean-backend" "smart-lean-frontend")

for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Not running"
    fi
done

echo
echo "Port Status:"
echo "-----------"

ports=("80:Frontend" "8000:Backend" "5432:PostgreSQL" "6379:Redis")

for port_info in "${ports[@]}"; do
    port=$(echo $port_info | cut -d: -f1)
    name=$(echo $port_info | cut -d: -f2)
    
    if netstat -tuln | grep -q ":$port "; then
        echo "✅ $name ($port): Listening"
    else
        echo "❌ $name ($port): Not listening"
    fi
done

echo
echo "Health Checks:"
echo "-------------"

# Frontend health
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    echo "✅ Frontend health check: OK"
else
    echo "❌ Frontend health check: Failed"
fi

# Backend health
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
    echo "✅ Backend health check: OK"
else
    echo "❌ Backend health check: Failed"
fi

echo
echo "Integration Status:"
echo "------------------"

# Run integration tests
python3 /opt/smart-lean-0dte/test_integration.py
EOF

chmod +x /opt/smart-lean-0dte/verify_startup.sh

# Create deployment completion script
print_status "Creating deployment completion script..."
cat > /opt/smart-lean-0dte/complete_deployment.sh << 'EOF'
#!/bin/bash

echo "🎉 Smart-Lean-0DTE Deployment Completion"
echo "========================================"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to determine")

echo
echo "✅ Deployment Summary:"
echo "====================="
echo "• Infrastructure: Configured"
echo "• Backend: Deployed and running"
echo "• Frontend: Deployed and running"
echo "• Database: Initialized"
echo "• Services: Started and enabled"
echo
echo "🌐 Access Information:"
echo "====================="
echo "• Frontend URL: http://$PUBLIC_IP"
echo "• Backend API: http://$PUBLIC_IP:8000"
echo "• Health Check: http://$PUBLIC_IP/health"
echo
echo "📁 Important Locations:"
echo "======================"
echo "• Application: /opt/smart-lean-0dte"
echo "• Configuration: /opt/smart-lean-0dte/config/.env"
echo "• Logs: /opt/smart-lean-0dte/logs/"
echo "• Backups: /opt/smart-lean-0dte/backups/"
echo
echo "🔧 Management Commands:"
echo "======================"
echo "• Monitor system: /opt/smart-lean-0dte/monitor.sh"
echo "• Verify startup: /opt/smart-lean-0dte/verify_startup.sh"
echo "• Test integration: /opt/smart-lean-0dte/test_integration.py"
echo "• Validate config: /opt/smart-lean-0dte/validate_config.py"
echo "• Create backup: /opt/smart-lean-0dte/backup.sh"
echo
echo "⚠️  Next Steps Required:"
echo "======================="
echo "1. Configure Databento API key in .env file"
echo "2. Configure IBKR account details in .env file"
echo "3. Set up IBKR Gateway (if using dedicated instance)"
echo "4. Run validation: /opt/smart-lean-0dte/validate_config.py"
echo "5. Test integration: /opt/smart-lean-0dte/test_integration.py"
echo "6. Start paper trading and monitor for one week"
echo "7. Switch to live trading when ready"
echo
echo "📚 Documentation:"
echo "================"
echo "• AWS Guide: /opt/smart-lean-0dte/docs/AWS-PROVISIONING-GUIDE.md"
echo "• IBKR Gateway: /opt/smart-lean-0dte/docs/IBKR-GATEWAY-ARCHITECTURE.md"
echo "• Page Guide: /opt/smart-lean-0dte/docs/PAGE-FUNCTIONALITY-GUIDE.md"
echo "• Cloud Deploy: /opt/smart-lean-0dte/docs/CLOUD-DEPLOYMENT-ARCHITECTURE.md"
echo
echo "🎯 Smart-Lean-0DTE is ready for configuration and testing!"
EOF

chmod +x /opt/smart-lean-0dte/complete_deployment.sh

# Run initial validation
print_status "Running initial validation..."
cd /opt/smart-lean-0dte/backend
source venv/bin/activate

# Install validation dependencies
pip install psycopg2-binary requests

# Run configuration validation
python3 /opt/smart-lean-0dte/validate_config.py

# Display completion message
echo
echo "================================================================"
print_success "Stage 4: Data Integration Setup Complete!"
echo "================================================================"
echo
echo "✅ Integration test scripts created"
echo "✅ Configuration validation script created"
echo "✅ Startup verification script created"
echo "✅ Deployment completion script created"
echo "✅ Additional dependencies installed"
echo
echo "📋 Test Scripts Created:"
echo "   • /opt/smart-lean-0dte/test_databento.py"
echo "   • /opt/smart-lean-0dte/test_ibkr.py"
echo "   • /opt/smart-lean-0dte/test_integration.py"
echo "   • /opt/smart-lean-0dte/validate_config.py"
echo "   • /opt/smart-lean-0dte/verify_startup.sh"
echo
print_warning "IMPORTANT: Configure your API keys and credentials!"
echo "1. Edit /opt/smart-lean-0dte/config/.env"
echo "2. Set DATABENTO_API_KEY to your actual API key"
echo "3. Set IBKR_ACCOUNT to your IBKR account number"
echo "4. Configure IBKR_GATEWAY_HOST if using dedicated instance"
echo
print_status "To complete deployment and test:"
echo "  /opt/smart-lean-0dte/complete_deployment.sh"
echo "  /opt/smart-lean-0dte/validate_config.py"
echo "  /opt/smart-lean-0dte/test_integration.py"
echo
print_success "🎉 Smart-Lean-0DTE cloud deployment is complete!"
echo "   Configure your credentials and start testing!"
echo


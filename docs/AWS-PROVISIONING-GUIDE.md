# AWS Provisioning Guide for Smart-Lean-0DTE

## Complete Beginner's Guide to AWS Cloud Deployment

This guide provides step-by-step instructions for provisioning AWS infrastructure for Smart-Lean-0DTE, including dedicated IBKR gateway architecture and multi-application support.

---

## Prerequisites

### What You'll Need
- AWS Account (free tier eligible)
- Credit card for AWS billing
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- Basic command line familiarity
- Databento API key (obtain from databento.com)
- IBKR account with API access enabled

### Estimated Costs
- **Main Application Instance**: $20-40/month (t3.medium)
- **IBKR Gateway Instance**: $10-20/month (t3.small)
- **Storage**: $5-10/month
- **Data Transfer**: $5-15/month
- **Total**: ~$40-85/month

---

## Part 1: AWS Account Setup

### Step 1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Enter email address and account name
4. Choose "Personal" account type
5. Enter billing information (required even for free tier)
6. Verify phone number
7. Choose "Basic Support Plan" (free)

### Step 2: Access AWS Console
1. Sign in to [AWS Management Console](https://console.aws.amazon.com)
2. You'll see the AWS dashboard with all services

### Step 3: Create IAM User (Security Best Practice)
1. Search for "IAM" in the AWS console
2. Click "Users" → "Add users"
3. Username: `smart-lean-admin`
4. Access type: ✅ "Programmatic access" ✅ "AWS Management Console access"
5. Set console password (choose strong password)
6. Attach policies: `AdministratorAccess` (for simplicity)
7. Download credentials CSV file (KEEP SAFE!)
8. Sign out and sign back in with new IAM user

---

## Part 2: Network Setup (VPC Configuration)

### Step 1: Create VPC (Virtual Private Cloud)
1. Search for "VPC" in AWS console
2. Click "Create VPC"
3. Configuration:
   - **Name**: `smart-lean-vpc`
   - **IPv4 CIDR**: `10.0.0.0/16`
   - **IPv6 CIDR**: No IPv6 CIDR block
   - **Tenancy**: Default
4. Click "Create VPC"

### Step 2: Create Subnets
1. In VPC dashboard, click "Subnets" → "Create subnet"
2. **Public Subnet** (for main application):
   - **VPC**: Select `smart-lean-vpc`
   - **Name**: `smart-lean-public-subnet`
   - **Availability Zone**: Choose any (e.g., us-east-1a)
   - **IPv4 CIDR**: `10.0.1.0/24`
3. **Private Subnet** (for IBKR gateway):
   - **Name**: `smart-lean-private-subnet`
   - **Availability Zone**: Same as public subnet
   - **IPv4 CIDR**: `10.0.2.0/24`

### Step 3: Create Internet Gateway
1. Click "Internet Gateways" → "Create internet gateway"
2. **Name**: `smart-lean-igw`
3. After creation, select it and click "Actions" → "Attach to VPC"
4. Select `smart-lean-vpc`

### Step 4: Create Route Tables
1. Click "Route Tables" → "Create route table"
2. **Public Route Table**:
   - **Name**: `smart-lean-public-rt`
   - **VPC**: `smart-lean-vpc`
   - After creation, click "Routes" tab → "Edit routes"
   - Add route: `0.0.0.0/0` → Target: Internet Gateway (`smart-lean-igw`)
   - Click "Subnet Associations" → "Edit subnet associations"
   - Associate with `smart-lean-public-subnet`

3. **Private Route Table** (already exists as main route table):
   - Find the main route table for your VPC
   - Rename to `smart-lean-private-rt`
   - Associate with `smart-lean-private-subnet`

---

## Part 3: Security Groups (Firewall Rules)

### Step 1: Main Application Security Group
1. Click "Security Groups" → "Create security group"
2. Configuration:
   - **Name**: `smart-lean-main-sg`
   - **Description**: Security group for main application
   - **VPC**: `smart-lean-vpc`

3. **Inbound Rules**:
   ```
   Type        Protocol    Port Range    Source          Description
   SSH         TCP         22           0.0.0.0/0       SSH access
   HTTP        TCP         80           0.0.0.0/0       Web access
   HTTPS       TCP         443          0.0.0.0/0       Secure web access
   Custom TCP  TCP         8000         0.0.0.0/0       Backend API
   Custom TCP  TCP         3000         0.0.0.0/0       Frontend (dev)
   ```

4. **Outbound Rules**: Leave default (all traffic allowed)

### Step 2: IBKR Gateway Security Group
1. Create another security group:
   - **Name**: `smart-lean-ibkr-sg`
   - **Description**: Security group for IBKR Gateway
   - **VPC**: `smart-lean-vpc`

2. **Inbound Rules**:
   ```
   Type        Protocol    Port Range    Source                    Description
   SSH         TCP         22           smart-lean-main-sg        SSH from main instance
   Custom TCP  TCP         4001         smart-lean-main-sg        TWS Gateway
   Custom TCP  TCP         4002         smart-lean-main-sg        TWS Gateway backup
   Custom TCP  TCP         7496         smart-lean-main-sg        TWS API
   Custom TCP  TCP         7497         smart-lean-main-sg        TWS API paper
   ```

3. **Outbound Rules**: Leave default

---

## Part 4: Key Pair Creation

### Step 1: Create SSH Key Pair
1. Search for "EC2" in AWS console
2. In left sidebar, click "Key Pairs"
3. Click "Create key pair"
4. Configuration:
   - **Name**: `smart-lean-keypair`
   - **Key pair type**: RSA
   - **Private key file format**: .pem (for Mac/Linux) or .ppk (for Windows/PuTTY)
5. Click "Create key pair"
6. **IMPORTANT**: Download and save the private key file securely
7. Set proper permissions (Mac/Linux): `chmod 400 smart-lean-keypair.pem`

---

## Part 5: EC2 Instance Provisioning

### Step 1: Launch Main Application Instance
1. In EC2 dashboard, click "Launch Instance"
2. **Name**: `smart-lean-main`
3. **Application and OS Images**:
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Architecture**: 64-bit (x86)

4. **Instance Type**:
   - **Recommended**: `t3.medium` (2 vCPU, 4 GB RAM)
   - **Budget Option**: `t3.small` (2 vCPU, 2 GB RAM)
   - **Performance Option**: `t3.large` (2 vCPU, 8 GB RAM)

5. **Key Pair**: Select `smart-lean-keypair`

6. **Network Settings**:
   - **VPC**: `smart-lean-vpc`
   - **Subnet**: `smart-lean-public-subnet`
   - **Auto-assign public IP**: Enable
   - **Security Group**: Select existing `smart-lean-main-sg`

7. **Storage**:
   - **Size**: 30 GB (minimum recommended)
   - **Volume Type**: gp3 (General Purpose SSD)
   - **Delete on termination**: ✅ (checked)

8. **Advanced Details**:
   - **User data** (optional - basic setup):
   ```bash
   #!/bin/bash
   apt update
   apt install -y git curl wget
   echo "Smart-Lean-0DTE main instance initialized" > /home/ubuntu/init.log
   ```

9. Click "Launch Instance"

### Step 2: Launch IBKR Gateway Instance
1. Click "Launch Instance" again
2. **Name**: `smart-lean-ibkr-gateway`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance Type**: `t3.small` (sufficient for gateway)
5. **Key Pair**: `smart-lean-keypair`
6. **Network Settings**:
   - **VPC**: `smart-lean-vpc`
   - **Subnet**: `smart-lean-private-subnet`
   - **Auto-assign public IP**: Disable
   - **Security Group**: `smart-lean-ibkr-sg`

7. **Storage**: 20 GB (sufficient for gateway)
8. **User data**:
   ```bash
   #!/bin/bash
   apt update
   apt install -y openjdk-11-jdk xvfb
   echo "IBKR Gateway instance initialized" > /home/ubuntu/init.log
   ```

9. Click "Launch Instance"

---

## Part 6: Elastic IP Assignment

### Step 1: Allocate Elastic IP
1. In EC2 dashboard, click "Elastic IPs"
2. Click "Allocate Elastic IP address"
3. **Network Border Group**: Default
4. Click "Allocate"

### Step 2: Associate with Main Instance
1. Select the allocated Elastic IP
2. Click "Actions" → "Associate Elastic IP address"
3. **Resource type**: Instance
4. **Instance**: Select `smart-lean-main`
5. Click "Associate"

**Note**: IBKR Gateway instance doesn't need Elastic IP as it's in private subnet

---

## Part 7: NAT Gateway (for IBKR Gateway Internet Access)

### Step 1: Create NAT Gateway
1. In VPC dashboard, click "NAT Gateways" → "Create NAT gateway"
2. Configuration:
   - **Name**: `smart-lean-nat`
   - **Subnet**: `smart-lean-public-subnet`
   - **Connectivity type**: Public
   - **Elastic IP allocation**: Click "Allocate Elastic IP"

### Step 2: Update Private Route Table
1. Go to "Route Tables"
2. Select `smart-lean-private-rt`
3. Click "Routes" tab → "Edit routes"
4. Add route: `0.0.0.0/0` → Target: NAT Gateway (`smart-lean-nat`)
5. Save changes

---

## Part 8: Connect to Instances

### Step 1: Connect to Main Instance
1. In EC2 dashboard, select `smart-lean-main` instance
2. Click "Connect"
3. **SSH Client tab** shows connection command:
   ```bash
   ssh -i "smart-lean-keypair.pem" ubuntu@YOUR_ELASTIC_IP
   ```

### Step 2: Connect to IBKR Gateway (via Main Instance)
1. First, copy your private key to main instance:
   ```bash
   scp -i "smart-lean-keypair.pem" smart-lean-keypair.pem ubuntu@YOUR_ELASTIC_IP:~/
   ```

2. SSH to main instance, then to gateway:
   ```bash
   ssh -i "smart-lean-keypair.pem" ubuntu@YOUR_ELASTIC_IP
   # On main instance:
   chmod 400 smart-lean-keypair.pem
   ssh -i "smart-lean-keypair.pem" ubuntu@GATEWAY_PRIVATE_IP
   ```

---

## Part 9: Domain Setup (Optional but Recommended)

### Step 1: Register Domain
1. Use AWS Route 53 or external provider (Namecheap, GoDaddy)
2. Example: `smart-lean-trading.com`

### Step 2: Configure DNS
1. In Route 53, create hosted zone for your domain
2. Create A record pointing to your Elastic IP
3. Create CNAME for `www` pointing to main domain

---

## Part 10: SSL Certificate (Optional but Recommended)

### Step 1: Request Certificate
1. Search for "Certificate Manager" in AWS console
2. Click "Request a certificate"
3. **Certificate type**: Request a public certificate
4. **Domain names**: 
   - `smart-lean-trading.com`
   - `www.smart-lean-trading.com`
5. **Validation method**: DNS validation
6. Follow validation instructions

---

## Deployment Process Clarification

### ❓ **Your Question**: "Do we run scripts on cloud instance or local?"

### ✅ **Answer**: **Scripts run ON the cloud instances, NOT locally**

#### **Deployment Flow**:
1. **Local Machine**: Only used for SSH connection to cloud
2. **Cloud Instance**: All deployment scripts run here
3. **No Local Building**: No need to build images locally
4. **Direct Deployment**: Scripts install and configure everything on cloud

#### **Step-by-Step Process**:
```bash
# 1. Connect to main instance from your local machine
ssh -i "smart-lean-keypair.pem" ubuntu@YOUR_ELASTIC_IP

# 2. Clone repository on cloud instance
git clone https://github.com/TKTINC/smart-lean-0DTE.git
cd smart-lean-0DTE

# 3. Run deployment scripts ON the cloud instance
./deploy-cloud-1-infrastructure.sh
./deploy-cloud-2-backend.sh
./deploy-cloud-3-frontend.sh
./deploy-cloud-4-integration.sh
```

#### **No Local Docker/Building Required**:
- ❌ No local Docker image building
- ❌ No local compilation or packaging
- ❌ No image uploading to cloud
- ✅ Direct installation on cloud instances
- ✅ Scripts handle all dependencies
- ✅ Production-ready deployment

---

## Summary Checklist

### ✅ **AWS Infrastructure Created**:
- [ ] AWS Account and IAM user
- [ ] VPC with public/private subnets
- [ ] Security groups configured
- [ ] SSH key pair created
- [ ] Main application instance (t3.medium)
- [ ] IBKR Gateway instance (t3.small)
- [ ] Elastic IP assigned
- [ ] NAT Gateway for private subnet
- [ ] Domain and SSL (optional)

### ✅ **Ready for Deployment**:
- [ ] SSH access to both instances working
- [ ] Git repository accessible
- [ ] Databento API key ready
- [ ] IBKR credentials ready
- [ ] Network connectivity verified

### 🎯 **Next Steps**:
1. **Connect to main instance via SSH**
2. **Clone repository and run deployment scripts**
3. **Configure API keys and credentials**
4. **Test paper trading functionality**
5. **Deploy IBKR Gateway on dedicated instance**

This infrastructure provides a robust, scalable foundation for Smart-Lean-0DTE with proper security, networking, and multi-application support for the IBKR Gateway.


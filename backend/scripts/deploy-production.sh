#!/bin/bash

# Arad Billboards - Complete Production Deployment Script
# This script automates the entire production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="arad-billboards"
APP_DIR="/var/www/arad-billboards"
BACKUP_DIR="/var/backups/arad-billboards"
LOG_FILE="/var/log/arad-billboards-deploy.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check if required commands exist
    local required_commands=("node" "npm" "mysql" "nginx" "pm2")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is not installed. Please install it first."
        fi
    done
    
    # Check Node.js version
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        error "Node.js version 18 or higher is required. Current version: $(node -v)"
    fi
    
    # Check if PM2 is installed globally
    if ! pm2 --version &> /dev/null; then
        warn "PM2 not found. Installing PM2 globally..."
        npm install -g pm2
    fi
    
    log "System requirements check passed ✓"
}

# Create application directory
setup_directories() {
    log "Setting up application directories..."
    
    sudo mkdir -p $APP_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p /var/log/arad-billboards
    sudo mkdir -p $APP_DIR/logs
    sudo mkdir -p $APP_DIR/backups
    sudo mkdir -p $APP_DIR/public/uploads
    
    # Set proper permissions
    sudo chown -R $USER:$USER $APP_DIR
    sudo chmod -R 755 $APP_DIR
    
    log "Directories created ✓"
}

# Backup existing application
backup_existing() {
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        log "Backing up existing application..."
        
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        sudo cp -r $APP_DIR $BACKUP_DIR/$backup_name
        
        log "Backup created: $BACKUP_DIR/$backup_name ✓"
    fi
}

# Clone or update application code
update_code() {
    log "Updating application code..."
    
    cd $APP_DIR
    
    # If this is a git repository, pull latest changes
    if [ -d ".git" ]; then
        git pull origin main
    else
        warn "Not a git repository. Please ensure code is up to date."
    fi
    
    log "Code updated ✓"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd $APP_DIR/backend
    
    # Install production dependencies only
    npm ci --only=production
    
    # Install PM2 globally if not already installed
    if ! pm2 --version &> /dev/null; then
        npm install -g pm2
    fi
    
    log "Dependencies installed ✓"
}

# Setup environment configuration
setup_environment() {
    log "Setting up environment configuration..."
    
    cd $APP_DIR/backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        warn ".env file not found. Running production setup..."
        node scripts/setup-production.js
    else
        info ".env file already exists. Skipping setup."
    fi
    
    log "Environment configured ✓"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    cd $APP_DIR/backend
    
    # Test database connection
    log "Testing database connection..."
    if ! npm run test-db; then
        error "Database connection failed. Please check your database configuration."
    fi
    
    # Run migrations
    log "Running database migrations..."
    npm run migrate
    
    # Run seeders (optional)
    read -p "Do you want to run database seeders? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run seed
        log "Database seeded ✓"
    fi
    
    log "Database setup completed ✓"
}

# Setup SSL certificates (optional)
setup_ssl() {
    read -p "Do you want to setup SSL certificates? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Setting up SSL certificates..."
        
        # Install certbot if not installed
        if ! command -v certbot &> /dev/null; then
            sudo apt update
            sudo apt install -y certbot python3-certbot-nginx
        fi
        
        # Get domain name
        read -p "Enter your domain name (e.g., yourdomain.com): " domain
        
        if [ -n "$domain" ]; then
            # Obtain SSL certificate
            sudo certbot --nginx -d $domain -d www.$domain --non-interactive --agree-tos --email admin@$domain
            
            # Setup auto-renewal
            (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
            
            log "SSL certificate setup completed ✓"
        else
            warn "No domain provided. Skipping SSL setup."
        fi
    fi
}

# Configure Nginx
setup_nginx() {
    log "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # Redirect HTTP to HTTPS (if SSL is configured)
    # return 301 https://\$server_name\$request_uri;
    
    # For development or non-SSL setup
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files
    location /static/ {
        alias $APP_DIR/backend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # File upload size
    client_max_body_size 20M;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Remove default site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log "Nginx configured ✓"
}

# Setup PM2
setup_pm2() {
    log "Setting up PM2..."
    
    cd $APP_DIR/backend
    
    # Stop existing PM2 processes
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    log "PM2 setup completed ✓"
}

# Setup monitoring and logging
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Create log rotation configuration
    sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Setup health check script
    sudo tee /usr/local/bin/arad-health-check > /dev/null <<EOF
#!/bin/bash
# Health check script for Arad Billboards

APP_URL="http://localhost:3000/api/admin/health"
RESPONSE=\$(curl -s -o /dev/null -w "%{http_code}" \$APP_URL)

if [ "\$RESPONSE" = "200" ]; then
    echo "✓ Application is healthy"
    exit 0
else
    echo "✗ Application health check failed (HTTP \$RESPONSE)"
    exit 1
fi
EOF

    sudo chmod +x /usr/local/bin/arad-health-check
    
    # Add health check to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/arad-health-check") | crontab -
    
    log "Monitoring setup completed ✓"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Enable UFW if not already enabled
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application port (if not using reverse proxy)
    # sudo ufw allow 3000/tcp
    
    log "Firewall configured ✓"
}

# Final verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if application is running
    if pm2 list | grep -q $APP_NAME; then
        log "PM2 process is running ✓"
    else
        error "PM2 process is not running"
    fi
    
    # Check Nginx status
    if sudo systemctl is-active --quiet nginx; then
        log "Nginx is running ✓"
    else
        error "Nginx is not running"
    fi
    
    # Test application health
    sleep 5  # Wait for application to start
    if curl -s http://localhost:3000/api/admin/health > /dev/null; then
        log "Application health check passed ✓"
    else
        warn "Application health check failed"
    fi
    
    log "Deployment verification completed ✓"
}

# Display deployment summary
show_summary() {
    log "🎉 Deployment completed successfully!"
    echo
    info "Application Details:"
    info "  - Name: $APP_NAME"
    info "  - Directory: $APP_DIR"
    info "  - Port: 3000"
    info "  - Process Manager: PM2"
    info "  - Web Server: Nginx"
    echo
    info "Useful Commands:"
    info "  - View logs: pm2 logs $APP_NAME"
    info "  - Restart app: pm2 restart $APP_NAME"
    info "  - Stop app: pm2 stop $APP_NAME"
    info "  - Monitor: pm2 monit"
    info "  - Health check: /usr/local/bin/arad-health-check"
    echo
    info "Next Steps:"
    info "  1. Configure your domain DNS to point to this server"
    info "  2. Update CORS_ORIGIN in .env file with your domain"
    info "  3. Test the application with your domain"
    info "  4. Set up SSL certificates if not done already"
    echo
    warn "Important:"
    warn "  - Keep your .env file secure"
    warn "  - Regularly backup your database"
    warn "  - Monitor application logs"
    warn "  - Update dependencies regularly"
}

# Main deployment function
main() {
    log "Starting Arad Billboards Production Deployment..."
    echo
    
    check_root
    check_requirements
    setup_directories
    backup_existing
    update_code
    install_dependencies
    setup_environment
    setup_database
    setup_nginx
    setup_pm2
    setup_monitoring
    setup_firewall
    verify_deployment
    show_summary
    
    log "Deployment completed successfully! 🚀"
}

# Run main function
main "$@"



# SSL/TLS Configuration Guide for Arad Billboards

## Overview
This guide provides comprehensive instructions for setting up SSL/TLS certificates for the Arad Billboards system in production.

## 1. SSL Certificate Options

### Option A: Let's Encrypt (Free, Recommended)
Let's Encrypt provides free SSL certificates that auto-renew every 90 days.

### Option B: Commercial SSL Certificates
Purchase from providers like DigiCert, Comodo, or GoDaddy.

### Option C: Self-Signed Certificates (Development Only)
For testing purposes only - not recommended for production.

## 2. Let's Encrypt Setup (Recommended)

### Prerequisites
- Domain name pointing to your server
- Server with root/sudo access
- Ports 80 and 443 open

### Installation Steps

#### Step 1: Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx

# Or use snap (universal)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### Step 2: Obtain Certificate
```bash
# For Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For Apache
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com

# Standalone (if not using web server)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

#### Step 3: Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

#### Step 4: Set Up Auto-Renewal
```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 3. Nginx SSL Configuration

### Basic SSL Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;

    # Proxy to Node.js Application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static Files
    location /static/ {
        alias /path/to/your/app/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File Upload Size
    client_max_body_size 20M;
}
```

### Advanced SSL Configuration
```nginx
# Additional SSL settings for enhanced security
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
ssl_ecdh_curve secp384r1;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

## 4. Docker SSL Configuration

### Docker Compose with SSL
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: arad-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    networks:
      - arad-network

  app:
    build: .
    container_name: arad-app
    environment:
      - NODE_ENV=production
    networks:
      - arad-network

networks:
  arad-network:
    driver: bridge
```

### Nginx Configuration for Docker
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 5. SSL Testing and Validation

### Test SSL Configuration
```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/

# Test with curl
curl -I https://yourdomain.com
```

### SSL Monitoring Script
```bash
#!/bin/bash
# ssl-check.sh

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"

# Check certificate expiration
EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS_LEFT days"
    # Send email notification
    echo "SSL certificate for $DOMAIN expires in $DAYS_LEFT days" | mail -s "SSL Certificate Expiry Warning" $EMAIL
fi
```

## 6. Security Best Practices

### SSL/TLS Security Checklist
- [ ] Use TLS 1.2 or higher
- [ ] Disable weak ciphers
- [ ] Enable HSTS
- [ ] Set up OCSP stapling
- [ ] Use strong DH parameters
- [ ] Implement CSP headers
- [ ] Regular certificate monitoring
- [ ] Auto-renewal setup

### Additional Security Headers
```nginx
# Additional security headers
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
add_header Cross-Origin-Embedder-Policy "require-corp";
add_header Cross-Origin-Opener-Policy "same-origin";
add_header Cross-Origin-Resource-Policy "same-origin";
```

## 7. Troubleshooting

### Common SSL Issues

#### Certificate Not Trusted
- Check certificate chain
- Verify domain name matches
- Ensure proper certificate installation

#### Mixed Content Warnings
- Update all HTTP links to HTTPS
- Use relative URLs for internal resources
- Check CSP headers

#### Performance Issues
- Enable HTTP/2
- Use SSL session caching
- Optimize certificate size

### Debug Commands
```bash
# Check certificate details
openssl x509 -in /path/to/certificate.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Check certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts

# Verify certificate installation
curl -I https://yourdomain.com
```

## 8. Monitoring and Maintenance

### Certificate Monitoring
```bash
# Add to crontab for daily checks
0 9 * * * /path/to/ssl-check.sh

# Monitor certificate expiration
certbot certificates
```

### Log Monitoring
```bash
# Monitor SSL errors
tail -f /var/log/nginx/error.log | grep SSL

# Monitor certificate renewal
tail -f /var/log/letsencrypt/letsencrypt.log
```

## 9. Backup and Recovery

### Backup SSL Certificates
```bash
# Backup Let's Encrypt certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Backup Nginx configuration
sudo cp /etc/nginx/sites-available/yourdomain /path/to/backup/
```

### Recovery Procedures
1. Restore certificate files
2. Update Nginx configuration
3. Test SSL functionality
4. Monitor for errors

## 10. Production Checklist

### Pre-Deployment SSL Checklist
- [ ] SSL certificate installed and valid
- [ ] HTTP to HTTPS redirect configured
- [ ] Security headers implemented
- [ ] Certificate auto-renewal tested
- [ ] SSL Labs rating A+ achieved
- [ ] Mixed content issues resolved
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Backup procedures in place

This comprehensive SSL configuration ensures your Arad Billboards system is secure and ready for production deployment.



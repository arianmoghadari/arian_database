# راهنمای کامل دپلوی Production - سیستم بیلبورد آراد

## خلاصه
این راهنما تمام مراحل دپلوی پروژه را از صفر تا صد پوشش می‌دهد و شامل اسکریپت‌های خودکار برای تسهیل فرآیند است.

## پیش‌نیازها

### سخت‌افزار
- سرور با حداقل 2GB RAM
- 20GB فضای دیسک
- اتصال اینترنت پایدار

### نرم‌افزار
- Ubuntu 20.04+ یا CentOS 8+
- Node.js 18+
- MySQL 8.0+
- Nginx
- Git

## روش‌های دپلوی

### روش 1: دپلوی خودکار (توصیه شده)

#### مرحله 1: آماده‌سازی سرور
```bash
# ورود به سرور
ssh user@your-server-ip

# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب ابزارهای ضروری
sudo apt install -y curl git build-essential ufw

# نصب Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# نصب MySQL
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# نصب Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### مرحله 2: اجرای اسکریپت دپلوی
```bash
# دانلود پروژه
git clone https://your-repo.git /var/www/arad-billboards
cd /var/www/arad-billboards

# اجرای اسکریپت دپلوی
chmod +x backend/scripts/deploy-production.sh
./backend/scripts/deploy-production.sh
```

### روش 2: دپلوی دستی

#### مرحله 1: تنظیم دیتابیس
```bash
# ورود به MySQL
sudo mysql -u root -p

# ایجاد دیتابیس و کاربر
CREATE DATABASE arad_billboards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arad_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON arad_billboards.* TO 'arad_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### مرحله 2: تنظیم محیط
```bash
cd /var/www/arad-billboards/backend

# ایجاد فایل .env
cp env-template.txt .env

# ویرایش تنظیمات
nano .env
```

#### مرحله 3: نصب وابستگی‌ها
```bash
npm ci --only=production
```

#### مرحله 4: راه‌اندازی دیتابیس
```bash
# تست اتصال
npm run test-db

# اجرای مایگریشن‌ها
npm run migrate

# اجرای سیدرها (اختیاری)
npm run seed
```

#### مرحله 5: تنظیم Nginx
```bash
# ایجاد کانفیگ Nginx
sudo nano /etc/nginx/sites-available/arad-billboards
```

محتوای فایل:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
    }

    client_max_body_size 20M;
}
```

```bash
# فعال‌سازی سایت
sudo ln -s /etc/nginx/sites-available/arad-billboards /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### مرحله 6: راه‌اندازی PM2
```bash
# نصب PM2
npm install -g pm2

# شروع اپلیکیشن
pm2 start ecosystem.config.js

# ذخیره کانفیگ
pm2 save

# تنظیم startup
pm2 startup
```

### روش 3: دپلوی با Docker

#### مرحله 1: نصب Docker
```bash
# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### مرحله 2: تنظیم محیط
```bash
cd /var/www/arad-billboards/backend

# ایجاد فایل .env
cp env-template.txt .env

# ویرایش تنظیمات برای Docker
nano .env
```

تنظیمات مهم برای Docker:
```env
DB_HOST=mysql
REDIS_HOST=redis
NODE_ENV=production
```

#### مرحله 3: اجرای Docker Compose
```bash
# شروع سرویس‌ها
docker-compose up -d mysql redis

# انتظار برای آماده شدن دیتابیس
sleep 30

# اجرای مایگریشن‌ها
docker-compose exec app npm run migrate

# شروع اپلیکیشن
docker-compose up -d app nginx
```

## تنظیمات امنیتی

### فایروال
```bash
# فعال‌سازی UFW
sudo ufw enable

# اجازه SSH
sudo ufw allow ssh

# اجازه HTTP و HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# بررسی وضعیت
sudo ufw status
```

### SSL Certificate
```bash
# نصب Certbot
sudo apt install -y certbot python3-certbot-nginx

# دریافت گواهی SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# تنظیم auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### تنظیمات امنیتی اضافی
```bash
# غیرفعال کردن root login
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# تغییر پورت SSH
# Port 2222

# راه‌اندازی مجدد SSH
sudo systemctl restart ssh
```

## مانیتورینگ و نگهداری

### مانیتورینگ سیستم
```bash
# نصب htop برای مانیتورینگ
sudo apt install -y htop

# مانیتورینگ PM2
pm2 monit

# بررسی لاگ‌ها
pm2 logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### بکاپ خودکار
```bash
# ایجاد اسکریپت بکاپ
sudo nano /usr/local/bin/arad-backup.sh
```

محتوای اسکریپت:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/arad-billboards"
DATE=$(date +%Y%m%d_%H%M%S)

# بکاپ دیتابیس
mysqldump -u arad_user -p'StrongPassword123!' arad_billboards > $BACKUP_DIR/db_backup_$DATE.sql

# بکاپ فایل‌ها
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/arad-billboards

# حذف بکاپ‌های قدیمی (بیش از 30 روز)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

```bash
# قابل اجرا کردن اسکریپت
sudo chmod +x /usr/local/bin/arad-backup.sh

# اضافه کردن به crontab
echo "0 3 * * * /usr/local/bin/arad-backup.sh" | sudo crontab -
```

### به‌روزرسانی اپلیکیشن
```bash
# بکاپ قبل از به‌روزرسانی
/usr/local/bin/arad-backup.sh

# به‌روزرسانی کد
cd /var/www/arad-billboards
git pull origin main

# به‌روزرسانی وابستگی‌ها
cd backend
npm ci --only=production

# اجرای مایگریشن‌های جدید
npm run migrate

# راه‌اندازی مجدد اپلیکیشن
pm2 restart arad-billboards
```

## عیب‌یابی

### مشکلات رایج

#### خطای اتصال دیتابیس
```bash
# بررسی وضعیت MySQL
sudo systemctl status mysql

# بررسی لاگ‌های MySQL
sudo tail -f /var/log/mysql/error.log

# تست اتصال
npm run test-db
```

#### خطای PM2
```bash
# بررسی وضعیت
pm2 status

# بررسی لاگ‌ها
pm2 logs arad-billboards

# راه‌اندازی مجدد
pm2 restart arad-billboards
```

#### خطای Nginx
```bash
# بررسی کانفیگ
sudo nginx -t

# بررسی لاگ‌ها
sudo tail -f /var/log/nginx/error.log

# راه‌اندازی مجدد
sudo systemctl restart nginx
```

### اسکریپت عیب‌یابی
```bash
#!/bin/bash
# اسکریپت عیب‌یابی سیستم

echo "=== System Status ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Disk Usage ==="
df -h
echo ""

echo "=== PM2 Status ==="
pm2 status
echo ""

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
echo ""

echo "=== MySQL Status ==="
sudo systemctl status mysql --no-pager
echo ""

echo "=== Application Health ==="
curl -s http://localhost:3000/api/admin/health || echo "Health check failed"
echo ""

echo "=== Recent Logs ==="
pm2 logs --lines 10
```

## چک‌لیست نهایی

### قبل از دپلوی
- [ ] سرور آماده و به‌روزرسانی شده
- [ ] دامنه تنظیم شده
- [ ] SSL certificate آماده
- [ ] دیتابیس MySQL نصب شده
- [ ] Node.js 18+ نصب شده

### بعد از دپلوی
- [ ] اپلیکیشن در حال اجرا است
- [ ] دیتابیس متصل است
- [ ] Nginx در حال اجرا است
- [ ] SSL certificate فعال است
- [ ] فایروال تنظیم شده
- [ ] بکاپ خودکار فعال است
- [ ] مانیتورینگ راه‌اندازی شده

### تست‌های نهایی
- [ ] دسترسی به سایت از طریق دامنه
- [ ] تست API endpoints
- [ ] تست آپلود فایل
- [ ] تست احراز هویت
- [ ] تست عملکرد در مرورگرهای مختلف

## پشتیبانی

در صورت بروز مشکل:
1. بررسی لاگ‌های سیستم
2. اجرای اسکریپت عیب‌یابی
3. بررسی مستندات
4. تماس با تیم پشتیبانی

---

**نکته مهم**: این راهنما برای محیط production طراحی شده است. برای محیط development از دستورات ساده‌تر استفاده کنید.



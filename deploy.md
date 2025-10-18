# Deployment Guide (Production)

این راهنما، از صفر تا صد استقرار (Deploy) پروژه را روی سرور تولید پوشش می‌دهد. دو سناریو ارائه شده: روش سنتی (Node + PM2/systemd + Nginx + MySQL) و روش Docker Compose. همچنین چک‌لیست امنیت، بکاپ، لاگ و عیب‌یابی ارائه شده است.

## 0) پیش‌نیازها
- دامنه (اختیاری، برای HTTPS و Nginx)
- دسترسی SSH به سرور (Ubuntu 22.04 LTS یا Windows Server)
- Node.js LTS (v18+) و npm
- MySQL 8.x (یا MariaDB 10.6+)
- Git (برای pull کد)
- اختیاری: Docker و Docker Compose

## 1) آماده‌سازی سرور (Ubuntu)
```bash
# ورود به SSH
ssh user@your-server-ip

# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب ابزارهای لازم
sudo apt install -y curl git build-essential ufw

# نصب Node.js (LTS) با nvm یا nodesource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v

# نصب PM2 (برای اجرای دائم سرویس)
sudo npm i -g pm2
pm2 -v
```

## 2) نصب و پیکربندی MySQL (Ubuntu)
```bash
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# امن‌سازی اولیه
sudo mysql_secure_installation

# ورود به MySQL
sudo mysql -u root -p

# ساخت دیتابیس و کاربر (مقادیر را به دلخواه تغییر دهید)
CREATE DATABASE arad_billboards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arad_user'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON arad_billboards.* TO 'arad_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```
اگر MySQL از راه دور استفاده می‌شود، تنظیمات فایروال و bind-address را در `/etc/mysql/mysql.conf.d/mysqld.cnf` بررسی کنید.

## 3) کلون و نصب پروژه
```bash
cd /var/www
sudo mkdir arad && sudo chown -R $USER:$USER arad
cd arad

# کلون ریپو (یا انتقال فایل‌ها)
# git clone https://your-repo.git .

# نصب وابستگی‌های backend
cd backend
npm ci
```

## 4) پیکربندی محیط تولید
یک فایل `.env` در `backend/` ایجاد کنید (یا از `.env.production` استفاده کنید):
```env
NODE_ENV=production
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=arad_billboards
DB_USER=arad_user
DB_PASSWORD=StrongPassword123!

JWT_SECRET=change_me_to_a_long_random_secure_value
JWT_EXPIRES_IN=24h

CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

## 5) آماده‌سازی دیتابیس (مهاجرت و سید)
```bash
cd /var/www/arad/backend
npm run migrate
npm run seed   # اگر نمی‌خواهید داده نمونه، این مرحله را رد کنید
```

## 6) اجرای سرویس با PM2 (Ubuntu/Windows)
```bash
cd /var/www/arad/backend
pm2 start ./bin/www --name arad-api
pm2 save
pm2 startup   # دستور چاپی را اجرا کنید تا با بوت سیستم بالا بیاید
pm2 status
```
Logها:
```bash
pm2 logs arad-api --lines 200
```

## 7) راه‌اندازی Nginx به‌عنوان Reverse Proxy + HTTPS
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```
کانفیگ سایت (نمونه `/etc/nginx/sites-available/arad`):
```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_pass http://127.0.0.1:3000;
        proxy_read_timeout 90;
    }

    client_max_body_size 20M;
}
```
فعال‌سازی:
```bash
sudo ln -s /etc/nginx/sites-available/arad /etc/nginx/sites-enabled/arad
sudo nginx -t
sudo systemctl reload nginx
```
گواهی SSL رایگان با Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl status certbot.timer
```

## 8) فایروال (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 9) استقرار روی Windows Server (خلاصه)
- نصب Node.js و MySQL روی ویندوز
- نصب Git، PM2 (با `npm i -g pm2`)
- اجرای سرویس با PM2:
```powershell
cd C:\path\to\project\backend
npm ci
copy .env.production .env
npm run migrate
npm run seed   # اختیاری
pm2 start .\bin\www --name arad-api
pm2 save
pm2 startup    # دستور تولیدی را در PowerShell ادمین اجرا کنید
```
- برای reverse proxy می‌توانید از IIS + URL Rewrite استفاده کنید یا Nginx ویندوز.

## 10) استقرار با Docker Compose (گزینه جایگزین)
پیش‌نیاز: Docker و Docker Compose
```bash
cd backend
# docker-compose.yml از قبل موجود است (mysql, redis, app, nginx)
docker-compose up -d mysql redis
# مقداردهی .env برای app و متغیرهای DB_HOST=mysql
# سپس app و nginx
docker-compose up -d app nginx

docker-compose ps
```
- ولوم‌ها دیتابیس و uploads را پایدار نگه می‌دارند.
- برای SSL روی Nginx کانفیگ `docker/nginx/nginx.conf` و فولدر `docker/nginx/ssl` را تنظیم کنید.

## 11) به‌روزرسانی (Zero-downtime)
```bash
cd /var/www/arad
git pull origin main   # یا روش انتقال کد
cd backend
npm ci
npm run migrate        # اگر مایگریشن جدید دارید
pm2 reload arad-api
```

## 12) بکاپ و بازیابی
اسکریپت آماده:
```bash
cd backend
npm run backup    # ساخت بکاپ در backend/backups
# بازیابی:
npm run restore backups/backup-YYYY-MM-DD.sql
```
می‌توانید از cron استفاده کنید:
```bash
crontab -e
# هر روز ساعت 03:30 بکاپ
30 3 * * * cd /var/www/arad/backend && /usr/bin/node scripts/backup-db.js create >> /var/log/arad-backup.log 2>&1
```

## 13) مانیتورینگ و لاگ
- PM2: `pm2 logs`, `pm2 monit`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- اپلیکیشن: `backend/logs/combined.log`, `backend/logs/error.log` (وینستون)
- Health: `GET /api/admin/health` (ادمین)

## 14) امنیت و سخت‌سازی
- تغییر `JWT_SECRET`، `SESSION_SECRET`، پسورد DB
- محدودسازی CORS به دامنه‌های مجاز
- بستن پورت‌های غیرضروری با UFW
- محدودیت نرخ روی `/api/auth` (فعال است)
- افزایش اندازه فایل‌های آپلود طبق نیاز (همچنین Nginx `client_max_body_size`)
- جدا کردن شبکه پایگاه‌داده، عدم اکسپوز پورت 3306 روی اینترنت
- فعال‌سازی HTTPS و HSTS در Nginx

## 15) CI/CD (اختیاری)
- GitHub Actions: build + test + deploy via SSH/rsync/pm2
- مثال ساده: push به `main` → SSH به سرور → pull → `npm ci`, `npm run migrate`, `pm2 reload`

## 16) عیب‌یابی سریع
- پورت 3000 پاسخ نمی‌دهد:
  - `pm2 status` و `pm2 logs arad-api`
  - `.env` و اتصال DB را بررسی کنید
- خطای `ECONNREFUSED 127.0.0.1:3306`:
  - `systemctl status mysql`، کانفیگ DB و فایروال
- خطای `NODE_ENV` در ویندوز:
  - از `npm start` یا `cross-env` در اسکریپت dev استفاده کنید
- خطای `MODULE_NOT_FOUND`:
  - `npm ci` را در `backend` اجرا کنید
- خطای CORS:
  - `CORS_ORIGIN` در `.env` و هدرهای Nginx را بررسی کنید

## 17) چک‌لیست نهایی تولید
- [ ] `NODE_ENV=production`
- [ ] تنظیم `.env` امن و کامل
- [ ] `npm run migrate` روی تولید
- [ ] فعال بودن HTTPS و ریدایرکت 80→443
- [ ] پشتیبان‌گیری روزانه از DB
- [ ] محدودسازی دسترسی‌ها و فایروال
- [ ] مانیتورینگ و Health Check
- [ ] لاگ‌ چرخشی/مدیریت فضای دیسک

با اجرای مراحل بالا، API شما در محیط تولید با امنیت، پایداری و قابلیت مقیاس‌پذیری مناسب اجرا خواهد شد. موفق باشید! 🚀

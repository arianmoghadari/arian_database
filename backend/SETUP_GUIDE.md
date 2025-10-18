# راهنمای نصب و راه‌اندازی - سیستم بیلبورد آراد

## پیش‌نیازها
- Node.js 18+ 
- MySQL 8.0+
- npm یا yarn

## مراحل نصب

### 1. نصب وابستگی‌ها
```bash
cd backend
npm install
```

### 2. تنظیم دیتابیس MySQL
```sql
CREATE DATABASE arad_billboards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arad_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON arad_billboards.* TO 'arad_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. تنظیم متغیرهای محیطی
فایل `.env` را کپی کنید و تنظیمات دیتابیس را تغییر دهید:
```bash
cp .env.example .env
```

مقادیر مهم در `.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=arad_billboards
DB_USER=arad_user
DB_PASSWORD=your_password
JWT_SECRET=your_very_secure_jwt_secret_here
```

### 4. راه‌اندازی دیتابیس
```bash
npm run init-db
```

### 5. اجرای سرور
```bash
npm run dev
```

سرور روی `http://localhost:3000` اجرا می‌شود.

## دسترسی‌های پیش‌فرض
- **ادمین**: `admin@arad.com` / `admin123`
- **کاربر**: `user@arad.com` / `user123`

## استفاده با Docker

### اجرای کامل با Docker Compose
```bash
docker-compose up -d
```

### فقط دیتابیس و Redis
```bash
docker-compose up -d mysql redis
```

## تست API
```bash
# تست اتصال
curl http://localhost:3000/api/admin/health

# ورود ادمین
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arad.com","password":"admin123"}'
```

## مشکلات رایج

### خطای اتصال دیتابیس
- بررسی تنظیمات MySQL
- اطمینان از اجرای MySQL
- بررسی فایروال

### خطای JWT
- تغییر `JWT_SECRET` در `.env`
- بررسی تاریخ سیستم

### خطای CORS
- تنظیم `CORS_ORIGIN` در `.env`
- بررسی URL فرانت‌اند

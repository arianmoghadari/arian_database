# سیستم مدیریت بیلبورد آراد - Backend

## 📋 معرفی
سیستم مدیریت بیلبورد آراد یک پلتفرم کامل برای مدیریت و رزرو بیلبوردهای تبلیغاتی است که شامل پنل مدیریت، سیستم احراز هویت، مدیریت کاربران و گزارش‌گیری می‌باشد.

## 🚀 ویژگی‌ها

### 🔐 احراز هویت و امنیت
- سیستم احراز هویت JWT
- کنترل دسترسی مبتنی بر نقش (RBAC)
- رمزگذاری رمز عبور با bcrypt
- محدودیت نرخ درخواست (Rate Limiting)
- اعتبارسنجی ورودی‌ها
- محافظت در برابر حملات امنیتی

### 🗄️ مدیریت دیتابیس
- ORM Sequelize با MySQL
- مایگریشن‌های خودکار
- سیدرهای داده اولیه
- پشتیبان‌گیری خودکار
- بازیابی داده‌ها

### 📊 مدیریت محتوا
- مدیریت شهرها و استان‌ها
- مدیریت شرکای تجاری
- مدیریت بیلبوردها
- مدیریت کارت‌های محصول
- سیستم رزرو
- مدیریت سفارشات

### 📈 گزارش‌گیری و آمار
- گزارش‌های جامع
- آمار کاربران
- آمار فروش
- گزارش‌های مالی

### 🔧 ابزارهای توسعه
- API مستندسازی شده با Swagger
- مجموعه Postman
- اسکریپت‌های خودکار
- پشتیبانی از Docker
- مانیتورینگ و لاگ‌گیری

## 🛠️ تکنولوژی‌ها

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **Sequelize** - ORM
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Multer** - File Upload
- **Winston** - Logging
- **Helmet** - Security
- **CORS** - Cross-Origin Resource Sharing

### DevOps
- **Docker** - Containerization
- **PM2** - Process Management
- **Nginx** - Reverse Proxy
- **Let's Encrypt** - SSL Certificates

## 📦 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js 18+
- MySQL 8.0+
- npm یا yarn

### نصب سریع
```bash
# کلون کردن پروژه
git clone https://github.com/your-repo/arad-billboards.git
cd arad-billboards/backend

# نصب وابستگی‌ها
npm install

# تنظیم محیط
cp env-template.txt .env
# ویرایش فایل .env با تنظیمات خود

# راه‌اندازی دیتابیس
npm run init-db

# شروع سرور
npm run dev
```

### نصب کامل
```bash
# 1. نصب وابستگی‌ها
npm install

# 2. تنظیم دیتابیس MySQL
mysql -u root -p
CREATE DATABASE arad_billboards CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'arad_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON arad_billboards.* TO 'arad_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. تنظیم متغیرهای محیطی
cp env-template.txt .env
nano .env

# 4. راه‌اندازی دیتابیس
npm run migrate
npm run seed

# 5. تست اتصال دیتابیس
npm run test-db

# 6. شروع سرور
npm start
```

## 🔧 اسکریپت‌های موجود

### اسکریپت‌های اصلی
```bash
npm start              # شروع سرور در حالت production
npm run dev            # شروع سرور در حالت development
npm run prod           # شروع سرور در حالت production
```

### اسکریپت‌های دیتابیس
```bash
npm run init-db        # راه‌اندازی کامل دیتابیس
npm run migrate        # اجرای مایگریشن‌ها
npm run migrate:undo   # بازگشت مایگریشن آخر
npm run seed           # اجرای سیدرها
npm run seed:undo      # بازگشت سیدرها
npm run backup         # پشتیبان‌گیری از دیتابیس
npm run restore        # بازیابی دیتابیس
```

### اسکریپت‌های تست و عیب‌یابی
```bash
npm run test-api       # تست API endpoints
npm run test-db        # تست اتصال دیتابیس
```

### اسکریپت‌های تولید
```bash
npm run generate-secrets    # تولید کلیدهای امنیتی
npm run setup-production    # تنظیم محیط production
```

### اسکریپت‌های PM2
```bash
npm run pm2:start      # شروع با PM2
npm run pm2:stop       # توقف PM2
npm run pm2:restart    # راه‌اندازی مجدد PM2
npm run pm2:delete     # حذف از PM2
npm run pm2:logs       # نمایش لاگ‌ها
npm run pm2:status     # وضعیت PM2
```

## 🌐 API Endpoints

### احراز هویت
```
POST   /api/auth/register     # ثبت نام
POST   /api/auth/login        # ورود
GET    /api/auth/me           # اطلاعات کاربر
PUT    /api/auth/role         # تغییر نقش (ادمین)
```

### مدیریت شهرها
```
GET    /api/cities            # لیست شهرها
POST   /api/cities            # افزودن شهر (ادمین)
PUT    /api/cities/:id        # ویرایش شهر (ادمین)
DELETE /api/cities/:id        # حذف شهر (ادمین)
```

### مدیریت بیلبوردها
```
GET    /api/billboards        # لیست بیلبوردها
POST   /api/billboards        # افزودن بیلبورد (ادمین)
PUT    /api/billboards/:id    # ویرایش بیلبورد (ادمین)
DELETE /api/billboards/:id    # حذف بیلبورد (ادمین)
```

### مدیریت رزروها
```
GET    /api/reservations      # لیست رزروها
POST   /api/reservations      # ایجاد رزرو
PUT    /api/reservations/:id  # ویرایش رزرو
DELETE /api/reservations/:id  # لغو رزرو
```

### مدیریت سفارشات
```
GET    /api/orders            # لیست سفارشات
POST   /api/orders            # ایجاد سفارش
GET    /api/orders/:id        # جزئیات سفارش
PUT    /api/orders/:id        # ویرایش سفارش
```

### پنل مدیریت
```
GET    /api/admin/users       # مدیریت کاربران
GET    /api/admin/stats       # آمار سیستم
GET    /api/admin/health       # وضعیت سیستم
POST   /api/admin/backup       # پشتیبان‌گیری
```

## 🔒 امنیت

### تنظیمات امنیتی
- **Helmet**: محافظت در برابر حملات رایج
- **CORS**: کنترل دسترسی cross-origin
- **Rate Limiting**: محدودیت نرخ درخواست
- **Input Validation**: اعتبارسنجی ورودی‌ها
- **Password Hashing**: رمزگذاری رمز عبور
- **JWT**: احراز هویت امن

### بهترین روش‌ها
- استفاده از HTTPS در production
- تنظیم فایروال مناسب
- به‌روزرسانی منظم وابستگی‌ها
- مانیتورینگ لاگ‌ها
- پشتیبان‌گیری منظم

## 🐳 Docker

### اجرای با Docker
```bash
# ساخت و اجرای کانتینرها
docker-compose up -d

# اجرای مایگریشن‌ها
docker-compose exec app npm run migrate

# اجرای سیدرها
docker-compose exec app npm run seed
```

### فایل‌های Docker
- `Dockerfile`: تعریف کانتینر اپلیکیشن
- `docker-compose.yml`: تنظیمات سرویس‌ها
- `healthcheck.js`: بررسی سلامت اپلیکیشن

## 📊 مانیتورینگ

### لاگ‌گیری
- **Winston**: سیستم لاگ‌گیری پیشرفته
- **Morgan**: لاگ‌گیری درخواست‌های HTTP
- **PM2**: مانیتورینگ فرآیندها

### بررسی سلامت
```bash
# بررسی وضعیت API
curl http://localhost:3000/api/admin/health

# بررسی وضعیت PM2
pm2 status

# بررسی لاگ‌ها
pm2 logs
```

## 🚀 دپلوی Production

### دپلوی خودکار
```bash
# اجرای اسکریپت دپلوی
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### دپلوی دستی
1. تنظیم سرور
2. نصب وابستگی‌ها
3. تنظیم دیتابیس
4. تنظیم Nginx
5. راه‌اندازی PM2
6. تنظیم SSL

برای جزئیات بیشتر، فایل `PRODUCTION_DEPLOYMENT_GUIDE.md` را مطالعه کنید.

## 📚 مستندات

### فایل‌های مستندات
- `API_DOCUMENTATION.md`: مستندات کامل API
- `PRODUCTION_DEPLOYMENT_GUIDE.md`: راهنمای دپلوی
- `SSL_SETUP_GUIDE.md`: راهنمای تنظیم SSL
- `SETUP_GUIDE.md`: راهنمای نصب
- `swagger/swagger.yaml`: مستندات Swagger

### مجموعه Postman
- `postman/Arad_Billboards_API.postman_collection.json`
- `postman/Arad_Billboards_Environment.postman_environment.json`

## 🐛 عیب‌یابی

### مشکلات رایج

#### خطای اتصال دیتابیس
```bash
# بررسی وضعیت MySQL
sudo systemctl status mysql

# تست اتصال
npm run test-db
```

#### خطای PM2
```bash
# بررسی وضعیت
pm2 status

# بررسی لاگ‌ها
pm2 logs
```

#### خطای Nginx
```bash
# بررسی کانفیگ
sudo nginx -t

# بررسی لاگ‌ها
sudo tail -f /var/log/nginx/error.log
```

## 🤝 مشارکت

### گزارش باگ
1. بررسی Issues موجود
2. ایجاد Issue جدید با جزئیات کامل
3. ارائه اطلاعات محیط و مراحل تکرار

### ارسال Pull Request
1. Fork کردن پروژه
2. ایجاد branch جدید
3. اعمال تغییرات
4. ارسال Pull Request

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## 📞 پشتیبانی

### تماس
- ایمیل: support@arad.com
- تلفن: +98-21-12345678

### منابع
- مستندات: [docs.arad.com](https://docs.arad.com)
- API: [api.arad.com](https://api.arad.com)
- پشتیبانی: [support.arad.com](https://support.arad.com)

---

**نکته**: این پروژه برای استفاده تجاری طراحی شده است. لطفاً قبل از استفاده، تمام مستندات را مطالعه کنید.
# Backend Implementation Guide (Express + Sequelize + MySQL)

این راهنما، تمام کارهایی که روی بخش بک‌اند انجام شد را به‌صورت مرحله‌به‌مرحله، همراه با ساختار فایل‌ها، مدل‌های دیتابیس، روت‌ها، میان‌افزارها، اسکریپت‌ها، مستندات، تست و دیپلوی بیان می‌کند.

## 1) معماری و تکنولوژی‌ها
- Express.js برای HTTP API
- Sequelize ORM با درایور mysql2
- احراز هویت JWT با نقش‌ها (admin/user)
- اعتبارسنجی ورودی با express-validator
- آپلود فایل با Multer
- امنیت: Helmet، Rate Limiting، CORS، Sanitization، Compression
- لاگینگ: Winston
- مستندسازی: Swagger (OpenAPI) و Postman Collection
- اسکریپت‌ها: init-db، backup/restore دیتابیس، تست API

## 2) ساختار پوشه‌ها (مهم‌ترین فایل‌ها)
```
backend/
├── app.js                         # راه‌اندازی Express، CORS، امنیت، روت‌ها و error handler
├── bin/www                        # bootstrap سرور
├── package.json                   # اسکریپت‌ها و وابستگی‌ها
├── .sequelizerc                   # مسیرهای sequelize-cli
├── .env / .env.example            # تنظیمات محیطی
├── public/uploads/                # مسیر آپلود فایل‌ها
├── src/
│   ├── config/
│   │   ├── database.js            # پیکربندی Sequelize برای CLI
│   │   └── app.js                 # پیکربندی اپلیکیشن (CORS، JWT، upload، rate-limit ...)
│   ├── middleware/
│   │   ├── auth.js                # authRequired، requireRole
│   │   ├── validation.js          # اعتبارسنجی ورودی + handleValidationErrors
│   │   ├── errorHandler.js        # notFoundHandler، errorHandler جامع
│   │   ├── security.js            # helmet، compression، sanitizeRequest
│   │   └── rateLimiter.js         # generalLimiter، authLimiter، uploadLimiter
│   ├── models/
│   │   └── index.js               # تعریف مدل‌ها و ارتباطات Sequelize
│   ├── routes/
│   │   ├── auth.routes.js         # register, login, me
│   │   ├── cities.routes.js       # CRUD شهرها (admin)
│   │   ├── partners.routes.js     # CRUD شرکا (admin)
│   │   ├── billboards.routes.js   # لیست/فیلتر، جزئیات، CRUD (admin)
│   │   ├── product-cards.routes.js# مدیریت کارت محصول
│   │   ├── reservations.routes.js # رزرو با کنترل تداخل، confirm/cancel
│   │   ├── orders.routes.js       # سفارش با آیتم‌ها و محاسبه مبلغ
│   │   └── admin.routes.js        # آمار، مدیریت کاربران، activity، health
│   ├── scripts/
│   │   └── init-db.js             # تست اتصال، اجرای migrations و seeders
│   ├── migrations/                # ایجاد جداول و ایندکس‌ها
│   │   └── 20241201000001-create-tables.js
│   └── seeders/
│       └── 20241201000001-initial-data.js
├── swagger/swagger.yaml           # مستندات OpenAPI
├── postman/                       # کالکشن و محیط Postman
│   ├── Arad_Billboards_API.postman_collection.json
│   └── Arad_Billboards_Environment.postman_environment.json
├── scripts/
│   ├── backup-db.js               # ساخت و بازگردانی بکاپ MySQL
│   └── test-api.js                # تست خودکار چند مسیر کلیدی API
├── README.md                      # راهنمای کلی بک‌اند
├── API_DOCUMENTATION.md           # مستندات کامل Endpoints
├── SETUP_GUIDE.md                 # مراحل نصب و راه‌اندازی
└── docker-compose.yml, Dockerfile # (اختیاری) برای محیط Docker
```

## 3) پیکربندی محیط (.env)
نمونه متغیرها (در `backend/.env.example` آمده):
```
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=arad_billboards
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 4) مدل‌های دیتابیس (Sequelize)
- User: fullName, email(unique), passwordHash, role(admin|user), status(active|disabled)
- City: name(unique), slug(unique), status(active|inactive)
- Partner: name(unique), contactInfo, status
- Billboard: billboardCode(unique), title, length, width, squareMeter, position, region,
  priceNumber, flags: isReserved, isEmpty, isInactive, isBroadcasting, isCultural, imageUrl,
  روابط: belongsTo City, belongsTo Partner
- ProductCard: title, priceNumber, imageUrl, belongsTo Billboard (one-to-one)
- Reservation: status(pending|confirmed|cancelled|expired), reservedFrom, reservedTo, notes,
  belongsTo(User, Billboard)
- Order: status(draft|submitted|paid|cancelled), totalAmount, currency, belongsTo User
- OrderItem: qty, unitPrice, discountPercent, belongsTo(Order, Billboard)

ارتباطات در `src/models/index.js` تعریف شده‌اند.

## 5) روت‌ها و رفتارها
- /api/auth: ثبت‌نام، ورود، me (JWT)
- /api/cities: لیست با فیلتر، CRUD (admin)
- /api/partners: لیست با فیلتر، CRUD (admin)
- /api/billboards: لیست با فیلترهای search/labels/ownership/city، جزئیات، CRUD (admin)
- /api/product-cards: لیست/ایجاد/ویرایش/حذف کارت‌ها + دریافت کارتِ یک بیلبورد
- /api/reservations: ایجاد رزرو (بررسی تداخل تاریخی)، تایید (admin)، لغو
- /api/orders: ایجاد سفارش از آیتم‌ها با محاسبه مجموع، مشاهده، submit
- /api/admin: آمار سیستم، لیست کاربران، جزئیات کاربر، activity، health
- /api/uploads: آپلود تصویر (admin)

همه ورودی‌ها با `validation.js` اعتبارسنجی می‌شوند و خطاها به‌صورت ساختاریافته در `errorHandler.js` مدیریت می‌شوند.

## 6) امنیت و میان‌افزارها
- Helmet برای هدرهای امنیتی
- Compression برای فشرده‌سازی پاسخ‌ها
- Sanitization برای پاک‌سازی ورودی‌ها
- CORS با مبدأهای مجاز از .env
- Rate limiting سراسری + محدودکننده اختصاصی برای auth و uploads
- JWT auth و role guard

## 7) مایگریشن و سیدرها
- فایل migration: ایجاد جداول Users, Cities, Partners, Billboards, ProductCards, Reservations, Orders, OrderItems + ایندکس‌ها
- فایل seeder: ایجاد ادمین و کاربر تست، شهرها، شرکا، چند بیلبورد نمونه و کارت‌های محصول متناظر

اجرای یک‌باره:
```
cd backend
npm run init-db
```

## 8) اسکریپت‌ها و دستورات NPM
- `npm run dev` (پیشنهادی با cross-env در ویندوز): اجرای nodemon
- `npm start`: اجرای سرور
- `npm run init-db`: تست اتصال و اجرای migrations + seeders
- `npm run migrate` / `migrate:undo`: مدیریت مایگریشن‌ها
- `npm run seed` / `seed:undo`: اجرای سیدرها
- `npm run test-api`: تست خودکار چند مسیر کلیدی
- `npm run backup` / `restore`: بکاپ و بازگردانی دیتابیس

نکته ویندوز: اگر `NODE_ENV` خطا داد، از `cross-env` استفاده کنید یا `npm start` بزنید.

## 9) مستندسازی و تست API
- Swagger: فایل `backend/swagger/swagger.yaml` (قابل بارگذاری در Swagger UI)
- Postman: کالکشن و Environment در `backend/postman/` (Login → سایر درخواست‌ها)
- مستندات متنی: `backend/API_DOCUMENTATION.md`

## 10) Docker (اختیاری)
- `docker-compose.yml` شامل سرویس‌های MySQL, Redis, App, Nginx (برای محیط production)
- `Dockerfile` برای ساخت ایمیج اپلیکیشن

## 11) مشکل‌یابی رایج
- خطای `MODULE_NOT_FOUND`: `npm install` را در پوشه `backend` اجرا کنید.
- خطای `NODE_ENV` در ویندوز: به‌جای `npm run dev` از `npm start` یا `cross-env` استفاده کنید.
- خطای اتصال MySQL (ECONNREFUSED 127.0.0.1:3306):
  1) سرویس MySQL را راه‌اندازی کنید (services.msc یا XAMPP/WAMP یا docker-compose)
  2) مقادیر `.env` را مطابق سرور واقعی تنظیم کنید
  3) دیتابیس/یوزر را بسازید و دسترسی بدهید
  4) `npm run init-db` را اجرا کنید
- خطای validation: ورودی‌ها را مطابق `validation.js` و Swagger ارسال کنید.

## 12) تغییرات مهم انجام‌شده (High-level)
- افزودن وابستگی‌ها (Sequelize, mysql2, JWT, CORS, Helmet, RateLimit, Multer, Winston, express-validator، dotenv ...)
- پیاده‌سازی کامل مدل‌ها و ارتباطات + migration/seeders
- پیاده‌سازی روت‌های Auth, Cities, Partners, Billboards, Product Cards, Reservations, Orders, Admin, Uploads
- افزودن میدل‌ویرهای امنیت، اعتبارسنجی، محدودسازی نرخ، لاگینگ و مدیریت خطا
- اسکریپت‌های init-db، backup/restore، test-api
- مستندسازی کامل با Swagger و Postman + README و SETUP_GUIDE

## 13) شروع سریع
```
cd backend
npm install
copy .env.example .env   # تنظیم مقادیر دیتابیس
npm run init-db
npm start                 # یا npm run dev (پس از cross-env)
```

سرور: `http://localhost:3000`  و پایه API:  `/api`

---
این فایل، تصویر جامع از تمام تغییرات و نحوه استفاده از بک‌اند را ارائه می‌دهد. در صورت نیاز به سفارشی‌سازی بیشتر (پرداخت، ایمیل، کش، لاگ مرکزی، مانیتورینگ)، قابل توسعه است.

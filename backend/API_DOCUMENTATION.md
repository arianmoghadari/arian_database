# API Documentation - Arad Billboards System

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user
```json
{
  "fullName": "نام کاربر",
  "email": "user@example.com",
  "password": "password123"
}
```

#### POST /auth/login
Login user
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /auth/me
Get current user info (requires auth)

### Cities

#### GET /cities
Get all cities with optional filtering
- Query params: `status` (active/inactive), `page`, `limit`

#### POST /cities
Create new city (admin only)
```json
{
  "name": "نام شهر",
  "slug": "city-slug",
  "status": "active"
}
```

#### PUT /cities/:id
Update city (admin only)

#### DELETE /cities/:id
Delete city (admin only)

### Partners

#### GET /partners
Get all partners with optional filtering
- Query params: `status` (active/inactive), `page`, `limit`

#### POST /partners
Create new partner (admin only)
```json
{
  "name": "نام شریک",
  "contactInfo": "اطلاعات تماس",
  "status": "active"
}
```

#### PUT /partners/:id
Update partner (admin only)

#### DELETE /partners/:id
Delete partner (admin only)

### Billboards

#### GET /billboards
Get billboards with advanced filtering
- Query params:
  - `search`: Search in title, code, position, region
  - `labels`: Comma-separated (reserved,available,inactive,broadcasting,cultural)
  - `ownership`: Partner name
  - `city`: City name
  - `page`, `limit`

#### GET /billboards/:id
Get single billboard with related data

#### POST /billboards
Create new billboard (admin only)
```json
{
  "billboardCode": "T001",
  "title": "عنوان بیلبورد",
  "length": 6.0,
  "width": 3.0,
  "squareMeter": 18.0,
  "position": "موقعیت",
  "region": "منطقه",
  "priceNumber": 500.0,
  "cityId": 1,
  "partnerId": 1,
  "isReserved": false,
  "isEmpty": true,
  "isInactive": false,
  "isBroadcasting": false,
  "isCultural": false,
  "imageUrl": "/images/billboard.jpg"
}
```

#### PUT /billboards/:id
Update billboard (admin only)

#### DELETE /billboards/:id
Delete billboard (admin only)

### Product Cards

#### GET /product-cards
Get product cards with filtering
- Query params: `search`, `city`, `partner`, `page`, `limit`

#### GET /product-cards/:id
Get single product card

#### POST /product-cards
Create product card (admin only)
```json
{
  "title": "عنوان محصول",
  "priceNumber": 500.0,
  "imageUrl": "/images/product.jpg",
  "billboardId": 1
}
```

#### PUT /product-cards/:id
Update product card (admin only)

#### DELETE /product-cards/:id
Delete product card (admin only)

#### GET /product-cards/billboard/:billboardId
Get product card for specific billboard

### Reservations

#### GET /reservations
Get user's reservations (requires auth)
- Query params: `status` (pending/confirmed/cancelled/expired), `page`, `limit`

#### POST /reservations
Create new reservation (requires auth)
```json
{
  "billboardId": 1,
  "reservedFrom": "2024-01-01T00:00:00Z",
  "reservedTo": "2024-01-31T23:59:59Z",
  "notes": "یادداشت اختیاری"
}
```

#### POST /reservations/:id/confirm
Confirm reservation (admin only)

#### POST /reservations/:id/cancel
Cancel reservation (user or admin)

### Orders

#### POST /orders
Create new order (requires auth)
```json
{
  "items": [
    {
      "billboardId": 1,
      "qty": 2,
      "unitPrice": 500.0,
      "discountPercent": 10
    }
  ],
  "currency": "USD"
}
```

#### GET /orders/:id
Get order details (requires auth)

#### POST /orders/:id/submit
Submit order for processing (requires auth)

### Uploads

#### POST /uploads
Upload file (admin only)
- Form data with `file` field
- Returns: `{ "url": "/uploads/filename.jpg" }`

### Admin Panel

#### GET /admin/stats
Get dashboard statistics (admin only)

#### GET /admin/users
Get all users with filtering (admin only)
- Query params: `search`, `role`, `status`, `page`, `limit`

#### GET /admin/users/:id
Get user details with reservations and orders (admin only)

#### PUT /admin/users/:id
Update user (admin only)

#### DELETE /admin/users/:id
Delete user (admin only)

#### GET /admin/activity
Get recent activity (admin only)

#### GET /admin/health
System health check (admin only)

## Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [] // Optional validation details
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INTERNAL_ERROR`: Server error

## Response Formats

### List Responses
```json
{
  "items": [...],
  "page": 1,
  "limit": 20,
  "total": 100
}
```

### Single Item Responses
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Database Schema

### Users
- id, fullName, email, passwordHash, role, status, timestamps

### Cities
- id, name, slug, status, timestamps

### Partners
- id, name, contactInfo, status, timestamps

### Billboards
- id, billboardCode, title, length, width, squareMeter, position, region, priceNumber
- isReserved, isEmpty, isInactive, isBroadcasting, isCultural, imageUrl
- cityId (FK), partnerId (FK), timestamps

### ProductCards
- id, title, priceNumber, imageUrl, billboardId (FK), timestamps

### Reservations
- id, status, reservedFrom, reservedTo, notes
- billboardId (FK), userId (FK), timestamps

### Orders
- id, status, totalAmount, currency, userId (FK), timestamps

### OrderItems
- id, qty, unitPrice, discountPercent
- orderId (FK), billboardId (FK), timestamps

## Setup Instructions

1. Install dependencies: `npm install`
2. Create MySQL database: `arad_billboards`
3. Configure `.env` file with database credentials
4. Initialize database: `npm run init-db`
5. Start server: `npm run dev`

## Default Credentials

After seeding:
- Admin: `admin@arad.com` / `admin123`
- User: `user@arad.com` / `user123`

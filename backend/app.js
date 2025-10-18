var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

// Import security and rate limiting middleware
const { securityHeaders, compressionMiddleware, sanitizeRequest } = require('./src/middleware/security');
const { generalLimiter, authLimiter, uploadLimiter } = require('./src/middleware/rateLimiter');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
// API routes
var apiAuthRouter = require('./src/routes/auth.routes');
var apiCitiesRouter = require('./src/routes/cities.routes');
var apiPartnersRouter = require('./src/routes/partners.routes');
var apiBillboardsRouter = require('./src/routes/billboards.routes');
var apiReservationsRouter = require('./src/routes/reservations.routes');
var apiOrdersRouter = require('./src/routes/orders.routes');
var apiUploadsRouter = require('./src/routes/uploads.routes');
var apiProductCardsRouter = require('./src/routes/product-cards.routes');
var apiAdminRouter = require('./src/routes/admin.routes');
var apiReportsRouter = require('./src/routes/reports.routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Security middleware
app.use(securityHeaders);
app.use(compressionMiddleware);
app.use(sanitizeRequest);

// Rate limiting
app.use(generalLimiter);

// Basic middleware
app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Initialize database connection
const { sequelize } = require('./src/models');
sequelize.authenticate().then(()=>{
  console.log('Database connection established');
}).catch(err=>{
  console.error('Database connection failed', err);
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Mount API with specific rate limiting
app.use('/api/auth', authLimiter, apiAuthRouter);
app.use('/api/uploads', uploadLimiter, apiUploadsRouter);
app.use('/api/cities', apiCitiesRouter);
app.use('/api/partners', apiPartnersRouter);
app.use('/api/billboards', apiBillboardsRouter);
app.use('/api/reservations', apiReservationsRouter);
app.use('/api/orders', apiOrdersRouter);
app.use('/api/product-cards', apiProductCardsRouter);
app.use('/api/admin', apiAdminRouter);
app.use('/api/reports', apiReportsRouter);

// Import error handlers
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;

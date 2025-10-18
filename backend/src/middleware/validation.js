const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Auth validation
const validateRegister = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

// City validation
const validateCity = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('City name must be 2-100 characters'),
  body('slug').trim().isLength({ min: 2, max: 100 }).matches(/^[a-z0-9-]+$/).withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  handleValidationErrors
];

// Partner validation
const validatePartner = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Partner name must be 2-100 characters'),
  body('contactInfo').optional().isLength({ max: 500 }).withMessage('Contact info too long'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  handleValidationErrors
];

// Billboard validation
const validateBillboard = [
  body('billboardCode').trim().isLength({ min: 1, max: 50 }).withMessage('Billboard code required'),
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title too long'),
  body('length').optional().isFloat({ min: 0 }).withMessage('Length must be positive number'),
  body('width').optional().isFloat({ min: 0 }).withMessage('Width must be positive number'),
  body('squareMeter').optional().isFloat({ min: 0 }).withMessage('Square meter must be positive number'),
  body('position').optional().trim().isLength({ max: 200 }).withMessage('Position too long'),
  body('region').optional().trim().isLength({ max: 200 }).withMessage('Region too long'),
  body('priceNumber').optional().isFloat({ min: 0 }).withMessage('Price must be positive number'),
  body('cityId').isInt({ min: 1 }).withMessage('Valid city ID required'),
  body('partnerId').optional().isInt({ min: 1 }).withMessage('Valid partner ID required'),
  body('isReserved').optional().isBoolean().withMessage('isReserved must be boolean'),
  body('isEmpty').optional().isBoolean().withMessage('isEmpty must be boolean'),
  body('isInactive').optional().isBoolean().withMessage('isInactive must be boolean'),
  body('isBroadcasting').optional().isBoolean().withMessage('isBroadcasting must be boolean'),
  body('isCultural').optional().isBoolean().withMessage('isCultural must be boolean'),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  handleValidationErrors
];

// Product Card validation
const validateProductCard = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title required and must be 1-200 characters'),
  body('priceNumber').isFloat({ min: 0 }).withMessage('Price must be positive number'),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  body('billboardId').isInt({ min: 1 }).withMessage('Valid billboard ID required'),
  handleValidationErrors
];

// Reservation validation
const validateReservation = [
  body('billboardId').isInt({ min: 1 }).withMessage('Valid billboard ID required'),
  body('reservedFrom').isISO8601().withMessage('Valid start date required'),
  body('reservedTo').isISO8601().withMessage('Valid end date required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  handleValidationErrors
];

// Order validation
const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.billboardId').isInt({ min: 1 }).withMessage('Valid billboard ID required for each item'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('items.*.discountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be 0-100%'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID required'),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCity,
  validatePartner,
  validateBillboard,
  validateProductCard,
  validateReservation,
  validateOrder,
  validateId,
  validatePagination
};

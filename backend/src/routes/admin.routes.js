const express = require('express');
const { User, City, Partner, Billboard, ProductCard, Reservation, Order } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateId, validatePagination, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');
const router = express.Router();

// All admin routes require admin role
router.use(authRequired, requireRole('admin'));

// Dashboard stats
router.get('/stats', async (req, res) => {
  const [
    totalUsers,
    totalCities,
    totalPartners,
    totalBillboards,
    totalProductCards,
    totalReservations,
    totalOrders,
    activeReservations,
    pendingOrders
  ] = await Promise.all([
    User.count(),
    City.count(),
    Partner.count(),
    Billboard.count(),
    ProductCard.count(),
    Reservation.count(),
    Order.count(),
    Reservation.count({ where: { status: 'confirmed' } }),
    Order.count({ where: { status: 'submitted' } })
  ]);

  res.json({
    users: { total: totalUsers },
    cities: { total: totalCities },
    partners: { total: totalPartners },
    billboards: { total: totalBillboards },
    productCards: { total: totalProductCards },
    reservations: { total: totalReservations, active: activeReservations },
    orders: { total: totalOrders, pending: pendingOrders }
  });
});

// User management
router.get('/users', validatePagination, async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const where = {};

  if (search) {
    where[require('sequelize').Op.or] = [
      { fullName: { [require('sequelize').Op.like]: `%${search}%` } },
      { email: { [require('sequelize').Op.like]: `%${search}%` } }
    ];
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({ 
    items: rows, 
    page: Number(page), 
    limit: Number(limit), 
    total: count 
  });
});

router.get('/users/:id', validateId, async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['passwordHash'] },
    include: [
      { model: Reservation, include: [Billboard] },
      { model: Order, include: [{ model: require('../models').OrderItem, include: [Billboard] }] }
    ]
  });

  if (!user) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'User not found' } 
    });
  }

  res.json(user);
});

router.put('/users/:id', validateId, [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'user']),
  body('status').optional().isIn(['active', 'disabled']),
  handleValidationErrors
], async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'User not found' } 
    });
  }

  await user.update(req.body);
  const updatedUser = await User.findByPk(user.id, {
    attributes: { exclude: ['passwordHash'] }
  });

  res.json(updatedUser);
});

router.delete('/users/:id', validateId, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'User not found' } 
    });
  }

  // Prevent deleting the last admin
  if (user.role === 'admin') {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Cannot delete the last admin user' } 
      });
    }
  }

  await user.destroy();
  res.status(204).end();
});

// Recent activity
router.get('/activity', async (req, res) => {
  const { limit = 50 } = req.query;

  const [recentReservations, recentOrders, recentUsers] = await Promise.all([
    Reservation.findAll({
      include: [
        { model: User, attributes: ['id', 'fullName', 'email'] },
        { model: Billboard, attributes: ['id', 'billboardCode', 'title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    }),
    Order.findAll({
      include: [
        { model: User, attributes: ['id', 'fullName', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    }),
    User.findAll({
      attributes: ['id', 'fullName', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    })
  ]);

  res.json({
    reservations: recentReservations,
    orders: recentOrders,
    users: recentUsers
  });
});

// System health check
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    await require('../models').sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

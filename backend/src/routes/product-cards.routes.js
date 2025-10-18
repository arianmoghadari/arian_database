const express = require('express');
const { ProductCard, Billboard, City, Partner } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateProductCard, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

// Get all product cards with optional filters
router.get('/', validatePagination, async (req, res) => {
  const { page = 1, limit = 20, search, city, partner } = req.query;
  const where = {};
  const include = [
    { 
      model: Billboard, 
      required: true,
      include: [
        { model: City, required: false },
        { model: Partner, required: false }
      ]
    }
  ];

  if (search) {
    where.title = { [require('sequelize').Op.like]: `%${search}%` };
  }

  if (city) {
    include[0].include[0].where = { name: city };
    include[0].include[0].required = true;
  }

  if (partner) {
    include[0].include[1].where = { name: partner };
    include[0].include[1].required = true;
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await ProductCard.findAndCountAll({
    where,
    include,
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

// Get single product card
router.get('/:id', validateId, async (req, res) => {
  const productCard = await ProductCard.findByPk(req.params.id, {
    include: [
      { 
        model: Billboard,
        include: [City, Partner]
      }
    ]
  });

  if (!productCard) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'Product card not found' } 
    });
  }

  res.json(productCard);
});

// Create product card (admin only)
router.post('/', authRequired, requireRole('admin'), validateProductCard, async (req, res) => {
  const { title, priceNumber, imageUrl, billboardId } = req.body;

  // Check if billboard exists
  const billboard = await Billboard.findByPk(billboardId);
  if (!billboard) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'Billboard not found' } 
    });
  }

  // Check if product card already exists for this billboard
  const existingCard = await ProductCard.findOne({ where: { billboardId } });
  if (existingCard) {
    return res.status(409).json({ 
      error: { code: 'CONFLICT', message: 'Product card already exists for this billboard' } 
    });
  }

  const productCard = await ProductCard.create({
    title,
    priceNumber,
    imageUrl,
    billboardId
  });

  const fullProductCard = await ProductCard.findByPk(productCard.id, {
    include: [
      { 
        model: Billboard,
        include: [City, Partner]
      }
    ]
  });

  res.status(201).json(fullProductCard);
});

// Update product card (admin only)
router.put('/:id', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const productCard = await ProductCard.findByPk(req.params.id);
  if (!productCard) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'Product card not found' } 
    });
  }

  await productCard.update(req.body);

  const updatedCard = await ProductCard.findByPk(productCard.id, {
    include: [
      { 
        model: Billboard,
        include: [City, Partner]
      }
    ]
  });

  res.json(updatedCard);
});

// Delete product card (admin only)
router.delete('/:id', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const productCard = await ProductCard.findByPk(req.params.id);
  if (!productCard) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'Product card not found' } 
    });
  }

  await productCard.destroy();
  res.status(204).end();
});

// Get product cards for a specific billboard
router.get('/billboard/:billboardId', validateId, async (req, res) => {
  const productCard = await ProductCard.findOne({
    where: { billboardId: req.params.billboardId },
    include: [
      { 
        model: Billboard,
        include: [City, Partner]
      }
    ]
  });

  if (!productCard) {
    return res.status(404).json({ 
      error: { code: 'NOT_FOUND', message: 'Product card not found for this billboard' } 
    });
  }

  res.json(productCard);
});

module.exports = router;

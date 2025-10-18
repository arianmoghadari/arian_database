const express = require('express');
const { Op } = require('sequelize');
const { Billboard, City, Partner, ProductCard } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateBillboard, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

function parseLabels(labels) {
  const list = new Set(String(labels || '').split(',').map(s => s.trim()).filter(Boolean));
  return {
    reserved: list.has('reserved'),
    available: list.has('available'),
    inactive: list.has('inactive'),
    broadcasting: list.has('broadcasting'),
    cultural: list.has('cultural'),
  };
}

router.get('/', validatePagination, async (req, res) => {
  const { search, labels, ownership, city, page = 1, limit = 20 } = req.query;
  const where = {};
  const include = [
    { model: City, required: false },
    { model: Partner, required: false },
    { model: ProductCard, required: false },
  ];

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { billboardCode: { [Op.like]: term } },
      { position: { [Op.like]: term } },
      { region: { [Op.like]: term } },
    ];
  }

  const l = parseLabels(labels);
  if (l.inactive) where.isInactive = true;
  if (l.broadcasting) where.isBroadcasting = true;
  if (l.cultural) where.isCultural = true;
  if (l.reserved) where.isReserved = true;
  if (l.available) where.isEmpty = true;

  if (ownership) {
    include[1].where = { name: ownership };
    include[1].required = true;
  }

  if (city) {
    include[0].where = { name: city };
    include[0].required = true;
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Billboard.findAndCountAll({
    where,
    include,
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });

  res.json({ items: rows, page: Number(page), limit: Number(limit), total: count });
});

router.get('/:id', validateId, async (req, res) => {
  const bb = await Billboard.findByPk(req.params.id, { include: [City, Partner, ProductCard] });
  if (!bb) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Billboard not found' } });
  res.json(bb);
});

router.post('/', authRequired, requireRole('admin'), validateBillboard, async (req, res) => {
  const bb = await Billboard.create(req.body);
  res.status(201).json(bb);
});

router.put('/:id', authRequired, requireRole('admin'), validateId, validateBillboard, async (req, res) => {
  const bb = await Billboard.findByPk(req.params.id);
  if (!bb) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Billboard not found' } });
  await bb.update(req.body);
  res.json(bb);
});

router.delete('/:id', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const bb = await Billboard.findByPk(req.params.id);
  if (!bb) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Billboard not found' } });
  await bb.destroy();
  res.status(204).end();
});

module.exports = router;


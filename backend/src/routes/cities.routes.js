const express = require('express');
const { City } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateCity, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

router.get('/', validatePagination, async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const cities = await City.findAll({ where, order: [['name', 'ASC']] });
  res.json({ items: cities });
});

router.post('/', authRequired, requireRole('admin'), validateCity, async (req, res) => {
  const { name, slug, status } = req.body;
  const city = await City.create({ name, slug, status });
  res.status(201).json(city);
});

router.put('/:id', authRequired, requireRole('admin'), validateId, validateCity, async (req, res) => {
  const city = await City.findByPk(req.params.id);
  if (!city) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'City not found' } });
  await city.update(req.body);
  res.json(city);
});

router.delete('/:id', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const city = await City.findByPk(req.params.id);
  if (!city) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'City not found' } });
  await city.destroy();
  res.status(204).end();
});

module.exports = router;


const express = require('express');
const { Partner } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validatePartner, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

router.get('/', validatePagination, async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const partners = await Partner.findAll({ where, order: [['name', 'ASC']] });
  res.json({ items: partners });
});

router.post('/', authRequired, requireRole('admin'), validatePartner, async (req, res) => {
  const partner = await Partner.create(req.body);
  res.status(201).json(partner);
});

router.put('/:id', authRequired, requireRole('admin'), validateId, validatePartner, async (req, res) => {
  const partner = await Partner.findByPk(req.params.id);
  if (!partner) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Partner not found' } });
  await partner.update(req.body);
  res.json(partner);
});

router.delete('/:id', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const partner = await Partner.findByPk(req.params.id);
  if (!partner) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Partner not found' } });
  await partner.destroy();
  res.status(204).end();
});

module.exports = router;


const express = require('express');
const { Op } = require('sequelize');
const { Reservation, Billboard } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateReservation, validateId, validatePagination } = require('../middleware/validation');
const router = express.Router();

router.get('/', authRequired, validatePagination, async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  const items = await Reservation.findAll({ where, include: [Billboard], order: [['createdAt', 'DESC']] });
  res.json({ items });
});

router.post('/', authRequired, validateReservation, async (req, res) => {
  const { billboardId, reservedFrom, reservedTo, notes } = req.body;
  if (!billboardId || !reservedFrom || !reservedTo) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing fields' } });

  const overlap = await Reservation.findOne({
    where: {
      billboardId,
      status: { [Op.in]: ['pending', 'confirmed'] },
      [Op.or]: [
        { reservedFrom: { [Op.between]: [reservedFrom, reservedTo] } },
        { reservedTo: { [Op.between]: [reservedFrom, reservedTo] } },
        { reservedFrom: { [Op.lte]: reservedFrom }, reservedTo: { [Op.gte]: reservedTo } },
      ],
    },
  });
  if (overlap) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Time range overlaps existing reservation' } });

  const resv = await Reservation.create({ billboardId, userId: req.user.id, reservedFrom, reservedTo, notes, status: 'pending' });
  res.status(201).json(resv);
});

router.post('/:id/confirm', authRequired, requireRole('admin'), validateId, async (req, res) => {
  const resv = await Reservation.findByPk(req.params.id);
  if (!resv) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
  await resv.update({ status: 'confirmed' });
  await Billboard.update({ isReserved: true }, { where: { id: resv.billboardId } });
  res.json(resv);
});

router.post('/:id/cancel', authRequired, validateId, async (req, res) => {
  const resv = await Reservation.findByPk(req.params.id);
  if (!resv) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Reservation not found' } });
  if (req.user.role !== 'admin' && req.user.id !== resv.userId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not permitted' } });
  }
  await resv.update({ status: 'cancelled' });
  res.json(resv);
});

module.exports = router;


const express = require('express');
const { Order, OrderItem, Billboard } = require('../models');
const { authRequired } = require('../middleware/auth');
const { validateOrder, validateId } = require('../middleware/validation');
const router = express.Router();

router.post('/', authRequired, validateOrder, async (req, res) => {
  const { items = [], currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No items' } });

  const order = await Order.create({ userId: req.user.id, currency, status: 'draft' });
  let total = 0;
  for (const it of items) {
    const bb = await Billboard.findByPk(it.billboardId);
    if (!bb) continue;
    const unitPrice = Number(it.unitPrice ?? bb.priceNumber ?? 0);
    const discount = Math.min(100, Math.max(0, Number(it.discountPercent ?? 0)));
    const qty = Math.max(1, Number(it.qty ?? 1));
    const line = unitPrice * (1 - discount / 100) * qty;
    total += line;
    await OrderItem.create({ orderId: order.id, billboardId: bb.id, qty, unitPrice, discountPercent: discount });
  }
  await order.update({ totalAmount: total });
  const full = await Order.findByPk(order.id, { include: [OrderItem] });
  res.status(201).json(full);
});

router.get('/:id', authRequired, validateId, async (req, res) => {
  const order = await Order.findByPk(req.params.id, { include: [OrderItem] });
  if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
  if (req.user.role !== 'admin' && order.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not permitted' } });
  res.json(order);
});

router.post('/:id/submit', authRequired, validateId, async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
  if (req.user.role !== 'admin' && order.userId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not permitted' } });
  await order.update({ status: 'submitted' });
  res.json(order);
});

module.exports = router;


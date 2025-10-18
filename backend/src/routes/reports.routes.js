const express = require('express');
const { Report, Billboard, User } = require('../models');
const { authRequired, requireRole, requireAnyRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, validateId } = require('../middleware/validation');

const router = express.Router();

// Create a report (reporter or seller can create), associate with a billboard
router.post('/', authRequired, requireAnyRole(['reporter', 'seller', 'admin']), [
  body('billboardId').isInt({ min: 1 }).withMessage('Valid billboard ID required'),
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title 3-200 chars'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content at least 10 chars'),
  handleValidationErrors
], async (req, res) => {
  const { billboardId, title, content } = req.body;
  const report = await Report.create({ billboardId, title, content, authorId: req.user.id, status: 'submitted' });
  res.status(201).json(report);
});

// List reports - admin can see all; seller can see all; reporter sees own
router.get('/', authRequired, requireAnyRole(['admin', 'seller', 'reporter']), async (req, res) => {
  const where = {};
  if (req.user.role === 'reporter') where.authorId = req.user.id;
  const items = await Report.findAll({ where, include: [ { model: Billboard }, { model: User, as: 'author', attributes: ['id','fullName','email','role'] } ], order: [['createdAt', 'DESC']] });
  res.json({ items });
});

// Get a single report
router.get('/:id', authRequired, validateId, async (req, res) => {
  const report = await Report.findByPk(req.params.id, { include: [Billboard, { model: User, as: 'author', attributes: ['id','fullName','email','role'] }] });
  if (!report) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
  if (req.user.role === 'reporter' && report.authorId !== req.user.id) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not permitted' } });
  res.json(report);
});

// Admin can review/update status
router.post('/:id/review', authRequired, requireRole('admin'), validateId, [
  body('status').isIn(['submitted', 'reviewed', 'rejected']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  const report = await Report.findByPk(req.params.id);
  if (!report) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
  await report.update({ status: req.body.status });
  res.json(report);
});

module.exports = router;

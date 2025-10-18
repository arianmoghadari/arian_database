const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authRequired, requireRole } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const router = express.Router();

router.post('/register', validateRegister, async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing fields' } });
  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already used' } });
  const passwordHash = await bcrypt.hash(password, 10);
  // default role for self-registration could be 'reporter' if desired; using 'user' by default
  const user = await User.create({ fullName, email, passwordHash, role: 'reporter' });
  const token = jwt.sign({ id: user.id, role: user.role, fullName: user.fullName }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.status(201).json({ token, user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
});

router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  const token = jwt.sign({ id: user.id, role: user.role, fullName: user.fullName }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: ['id', 'fullName', 'email', 'role'] });
  res.json({ user });
});

// Admin can update a user's role
router.post('/role', authRequired, requireRole('admin'), async (req, res) => {
  const { userId, role } = req.body || {};
  if (!userId || !['admin','user','seller','reporter'].includes(role)) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid userId or role' } });
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
  await user.update({ role });
  res.json({ id: user.id, fullName: user.fullName, email: user.email, role: user.role });
});

module.exports = router;


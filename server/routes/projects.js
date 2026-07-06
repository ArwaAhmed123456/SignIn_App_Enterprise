const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const Site     = require('../models/Site');
const { generateResetToken, sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// Only superadmin can create/delete sites
const verifySuperAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Superadmin access required' });
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

const fmt = (s) => ({ id: s._id, _id: s._id, name: s.name, code: s.code, admin_email: s.adminEmail, created_at: s.createdAt });

router.get('/ping', (req, res) => res.json({ status: 'ok' }));

router.get('/:id/public', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Not found' });
    res.json(fmt(site));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    let sites;
    if (req.user.role === 'superadmin') {
      // Superadmin sees ALL sites
      sites = await Site.find().sort({ createdAt: -1 });
    } else {
      // Admin only sees their own site(s) — matched by their email
      sites = await Site.find({ adminEmail: req.user.email }).sort({ createdAt: -1 });
    }
    res.json(sites.map(fmt));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/', verifySuperAdmin, async (req, res) => {
  const { name, code, password, admin_email } = req.body;
  if (!name || !code || !password || !admin_email)
    return res.status(400).json({ error: 'Name, code, password and admin email are required' });
  try {
    const existing = await Site.findOne({ code: code.trim().toUpperCase() });
    if (existing) return res.status(400).json({ error: 'Project code already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const site = await Site.create({ name, code: code.trim().toUpperCase(), password: hashed, adminEmail: admin_email });
    res.json(fmt(site));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { name, code } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
  try {
    const conflict = await Site.findOne({ code: code.trim().toUpperCase(), _id: { $ne: req.params.id } });
    if (conflict) return res.status(400).json({ error: 'Project code already exists' });
    await Site.findByIdAndUpdate(req.params.id, { name, code: code.trim().toUpperCase() });
    res.json({ message: 'Project updated successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', verifySuperAdmin, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Not found' });
    await Site.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/verify-code', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Project code required' });
  try {
    const site = await Site.findOne({ code: code.trim().toUpperCase() });
    if (!site) return res.status(400).json({ error: 'Invalid project code' });
    res.json({ valid: true, project: fmt(site) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/verify-access', async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) return res.status(404).json({ error: 'Not found' });
    if (site.password) {
      const valid = await bcrypt.compare(req.body.password, site.password);
      if (!valid) return res.status(401).json({ error: 'Incorrect password' });
    }
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/password', verifyToken, async (req, res) => {
  if (!req.body.password) return res.status(400).json({ error: 'Password required' });
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    await Site.findByIdAndUpdate(req.params.id, { password: hash });
    res.json({ message: 'Password updated successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/forgot-password', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Project code required' });
  try {
    const site = await Site.findOne({ code: code.trim().toUpperCase() });
    if (!site) return res.status(404).json({ error: 'Project not found' });
    const resetToken  = generateResetToken();
    const expiry      = new Date(Date.now() + 15 * 60 * 1000);
    await Site.findByIdAndUpdate(site._id, { resetToken, resetTokenExpiry: expiry });
    await sendPasswordResetEmail(site.adminEmail, site.name, resetToken);
    res.json({ message: 'Reset code sent to your email', email: site.adminEmail });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/verify-reset-token', async (req, res) => {
  const { code, reset_token } = req.body;
  try {
    const site = await Site.findOne({ code: code.trim().toUpperCase(), resetToken: reset_token, resetTokenExpiry: { $gt: new Date() } });
    if (!site) return res.status(400).json({ error: 'Invalid or expired token' });
    res.json({ valid: true, message: 'Reset code verified' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/reset-password', async (req, res) => {
  const { code, reset_token, new_password } = req.body;
  try {
    const site = await Site.findOne({ code: code.trim().toUpperCase(), resetToken: reset_token, resetTokenExpiry: { $gt: new Date() } });
    if (!site) return res.status(400).json({ error: 'Invalid or expired token' });
    const hashed = await bcrypt.hash(new_password, 10);
    await Site.findByIdAndUpdate(site._id, { password: hashed, resetToken: null, resetTokenExpiry: null });
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

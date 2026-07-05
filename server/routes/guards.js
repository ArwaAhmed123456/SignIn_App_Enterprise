const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Member   = require('../models/Member');
const Site     = require('../models/Site');
const VisitorGroup = require('../models/VisitorGroup');
const { sendMobileInviteEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (!['admin','superadmin'].includes(decoded.role)) return res.status(403).json({ error: 'Admin access required' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

const fmtMember = async (m) => {
  const site  = m.siteId  ? await Site.findById(m.siteId).lean()  : null;
  const group = m.visitorGroupId ? await VisitorGroup.findById(m.visitorGroupId).lean() : null;
  return {
    id: m._id, name: `${m.firstName} ${m.lastName||''}`.trim(),
    first_name: m.firstName, last_name: m.lastName,
    email: m.email, phone: m.phone, status: m.status, role: m.role,
    start_date: m.startDate, end_date: m.endDate,
    visitor_group: group?.name ?? null, visitor_group_id: m.visitorGroupId,
    site: site?.name ?? null, site_id: m.siteId,
    mobile_paired: m.mobilePaired, created_at: m.createdAt,
    initials: `${m.firstName?.[0]||''}${m.lastName?.[0]||''}`.toUpperCase(),
  };
};

// ── Signup ───────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password, phone, project_id } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  try {
    const existing = await Member.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    await Member.create({ firstName: name, email, password: hashed, phone: phone||null, siteId: project_id||null, role: 'guard' });
    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── Login ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const guard = await Member.findOne({ email: email.trim() });
    if (!guard || !guard.password) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, guard.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: guard._id, email: guard.email, role: guard.role||'guard',
        permissions: guard.permissions ? JSON.parse(guard.permissions) : null },
      JWT_SECRET, { expiresIn: '24h' }
    );
    res.json({ success: true, token, user: { name: guard.firstName, email: guard.email, phone: guard.phone||null, role: guard.role||'guard', project_id: guard.siteId } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── List guards ──────────────────────────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const guards = await Member.find({ role: 'guard' }).sort({ createdAt: -1 }).lean();
    res.json(await Promise.all(guards.map(fmtMember)));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── Member endpoints ─────────────────────────────────────────────────

// GET /api/guards/members
router.get('/members', verifyAdmin, async (req, res) => {
  const { status, visitor_group_id, search, site_id } = req.query;
  try {
    const filter = {};
    if (status && status !== 'All')    filter.status         = status;
    if (visitor_group_id)              filter.visitorGroupId = visitor_group_id;
    if (site_id)                       filter.siteId         = site_id;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }
    const members = await Member.find(filter).sort({ createdAt: -1 }).lean();
    res.json(await Promise.all(members.map(fmtMember)));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/guards/members
router.post('/members', verifyAdmin, async (req, res) => {
  const { first_name, last_name, email, phone, role, status, start_date, end_date, visitor_group_id, site_id } = req.body;
  if (!first_name) return res.status(400).json({ error: 'first_name is required' });
  try {
    if (email) {
      const existing = await Member.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already exists' });
    }
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const s = await Site.findOne().sort({ createdAt: 1 });
      resolvedSiteId = s?._id;
    }

    // Only use visitor_group_id if it's a valid ObjectId — otherwise ignore it
    const mongoose = require('mongoose');
    const safeGroupId = visitor_group_id && mongoose.isValidObjectId(visitor_group_id)
      ? visitor_group_id
      : null;

    const member = await Member.create({
      firstName: first_name, lastName: last_name||null,
      email: email||null, phone: phone||null,
      role: role||'Employee', status: status||'Current',
      startDate: start_date ? new Date(start_date) : null,
      endDate:   end_date   ? new Date(end_date)   : null,
      visitorGroupId: safeGroupId,
      siteId: resolvedSiteId,
    });

    // Send welcome email if requested and member has an email
    if (req.body.send_welcome && email) {
      try {
        const { sendWelcomeEmail } = require('../services/emailService');
        const site = resolvedSiteId ? await Site.findById(resolvedSiteId).lean() : null;
        await sendWelcomeEmail({ email, name: first_name, siteName: site?.name || 'Sign In App' });
      } catch (emailErr) {
        console.warn('Welcome email failed:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, member: await fmtMember(member.toObject()) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/guards/members/:id
router.put('/members/:id', verifyAdmin, async (req, res) => {
  const { first_name, last_name, email, phone, role, status, start_date, end_date, visitor_group_id } = req.body;
  const updates = {};
  if (first_name       !== undefined) updates.firstName      = first_name;
  if (last_name        !== undefined) updates.lastName       = last_name;
  if (email            !== undefined) updates.email          = email;
  if (phone            !== undefined) updates.phone          = phone;
  if (role             !== undefined) updates.role           = role;
  if (status           !== undefined) updates.status         = status;
  if (start_date       !== undefined) updates.startDate      = start_date ? new Date(start_date) : null;
  if (end_date         !== undefined) updates.endDate        = end_date   ? new Date(end_date)   : null;
  if (visitor_group_id !== undefined) {
    const mongoose = require('mongoose');
    updates.visitorGroupId = visitor_group_id && mongoose.isValidObjectId(visitor_group_id) ? visitor_group_id : null;
  }
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, member: await fmtMember(member) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/guards/members/:id
router.delete('/members/:id', verifyAdmin, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/guards/members/:id/archive
router.post('/members/:id/archive', verifyAdmin, async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, { status: 'Archived' });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ── Mobile onboarding ────────────────────────────────────────────────

router.post('/:id/generate-mobile-token', verifyAdmin, async (req, res) => {
  try {
    const guard = await Member.findById(req.params.id);
    if (!guard) return res.status(404).json({ error: 'Guard not found' });
    const perms = guard.permissions ? JSON.parse(guard.permissions) : {};
    perms.can_mobile_sign_in = true;
    const plainToken = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    const hash   = await bcrypt.hash(plainToken, 10);
    const expiry = new Date(Date.now() + 24 * 3600000);
    await Member.findByIdAndUpdate(guard._id, { permissions: JSON.stringify(perms), mobileTokenHash: hash, mobileTokenExpiry: expiry });
    const emailResult = await sendMobileInviteEmail({ name: guard.firstName, email: guard.email }, plainToken);
    res.json({ success: true, expires_at: expiry, email_sent: emailResult.success });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/activate-mobile', async (req, res) => {
  const { token, device_id } = req.body;
  if (!token || !device_id) return res.status(400).json({ error: 'token and device_id required' });
  if (!/^\d{12}$/.test(token)) return res.status(400).json({ error: 'Token must be 12 digits' });
  try {
    const candidates = await Member.find({ mobileTokenExpiry: { $gt: new Date() }, mobilePaired: false });
    let matched = null;
    for (const c of candidates) {
      if (c.mobileTokenHash && await bcrypt.compare(token, c.mobileTokenHash)) { matched = c; break; }
    }
    if (!matched) return res.status(401).json({ error: 'Invalid or expired token' });
    await Member.findByIdAndUpdate(matched._id, { mobilePaired: true, mobileDeviceId: device_id, mobilePairedAt: new Date(), mobileTokenHash: null, mobileTokenExpiry: null });
    const mobileJwt = jwt.sign({ id: matched._id, email: matched.email, role: 'mobile_employee', project_id: matched.siteId, device_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, jwt_token: mobileJwt, guard: { id: matched._id, name: matched.firstName, email: matched.email } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/:id/revoke-mobile', verifyAdmin, async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, { mobilePaired: false, mobileDeviceId: null, mobileTokenHash: null, mobileTokenExpiry: null });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/assign-project', verifyAdmin, async (req, res) => {
  try {
    await Member.findByIdAndUpdate(req.params.id, { siteId: req.body.project_id||null });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id/permissions', verifyAdmin, async (req, res) => {
  const { role, permissions } = req.body;
  const updates = {};
  if (role)        updates.role        = role;
  if (permissions) updates.permissions = JSON.stringify(permissions);
  try {
    const guard = await Member.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!guard) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, guard: await fmtMember(guard.toObject()) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

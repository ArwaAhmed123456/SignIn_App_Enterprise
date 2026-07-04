/**
 * /api/pre-registrations — Pre-register visitors before they arrive
 */
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const prisma  = require('../prismaClient');
const { sendPreRegistrationInviteEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (!['admin', 'superadmin'].includes(decoded.role)) return res.status(403).json({ error: 'Admin access required' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

const fmt = (p) => ({
  id:              p.id,
  name:            p.name,
  email:           p.email,
  phone:           p.phone,
  notes:           p.notes,
  expected_date:   p.expectedDate,
  site_id:         p.siteId,
  site_name:       p.site?.name ?? null,
  visitor_group:   p.visitorGroup?.name ?? null,
  visitor_group_id:p.visitorGroupId,
  member_id:       p.memberId,
  status:          p.status,
  created_at:      p.createdAt,
});

// ── GET /api/pre-registrations ───────────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
  const { site_id, date, date_from, date_to, status, search, group } = req.query;

  try {
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      resolvedSiteId = s?.id;
    }

    const where = {};
    if (resolvedSiteId) where.siteId = resolvedSiteId;
    if (status && status !== 'All') where.status = status;
    if (date || date_from || date_to) {
      where.expectedDate = {};
    }
    if (date) {
      const d = new Date(date);
      const next = new Date(d.getTime() + 86400000);
      where.expectedDate.gte = d;
      where.expectedDate.lt = next;
    }
    if (date_from) where.expectedDate.gte = new Date(`${date_from}T00:00:00`);
    if (date_to) where.expectedDate.lte = new Date(`${date_to}T23:59:59`);
    if (search) where.name = { contains: search };
    if (group && group !== 'All') where.visitorGroup = { name: group };

    const items = await prisma.preRegistration.findMany({
      where,
      include: { site: true, visitorGroup: true },
      orderBy: { expectedDate: 'asc' },
    });

    res.json(items.map(fmt));
  } catch (err) {
    console.error('[GET /api/pre-registrations]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/pre-registrations ──────────────────────────────────────
router.post('/', verifyAdmin, async (req, res) => {
  const { site_id, name, email, phone, notes, expected_date, visitor_group_id, member_id, send_invitation } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!s) return res.status(400).json({ error: 'No site found' });
      resolvedSiteId = s.id;
    }

    const item = await prisma.preRegistration.create({
      data: {
        siteId:          resolvedSiteId,
        name,
        email:           email    || null,
        phone:           phone    || null,
        notes:           notes    || null,
        expectedDate:    expected_date ? new Date(expected_date) : null,
        visitorGroupId:  visitor_group_id || null,
        memberId:        member_id || null,
        status:          'Pending',
      },
      include: { site: true, visitorGroup: true },
    });

    if (send_invitation && email) {
      await sendPreRegistrationInviteEmail({
        email,
        name,
        siteName: item.site?.name,
        expectedDate: item.expectedDate,
        notes: item.notes,
      });
    }

    res.status(201).json({ success: true, pre_registration: fmt(item) });
  } catch (err) {
    console.error('[POST /api/pre-registrations]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/pre-registrations/:id ───────────────────────────────────
router.put('/:id', verifyAdmin, async (req, res) => {
  const { name, email, phone, notes, expected_date, visitor_group_id, status } = req.body;
  try {
    const updates = {};
    if (name !== undefined)            updates.name            = name;
    if (email !== undefined)           updates.email           = email;
    if (phone !== undefined)           updates.phone           = phone;
    if (notes !== undefined)           updates.notes           = notes;
    if (expected_date !== undefined)   updates.expectedDate    = expected_date ? new Date(expected_date) : null;
    if (visitor_group_id !== undefined)updates.visitorGroupId  = visitor_group_id;
    if (status !== undefined)          updates.status          = status;

    const item = await prisma.preRegistration.update({
      where: { id: req.params.id },
      data: updates,
      include: { site: true, visitorGroup: true },
    });
    res.json({ success: true, pre_registration: fmt(item) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/pre-registrations/:id ────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.preRegistration.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/pre-registrations/:id/arrive ────────────────────────────
// Convert a pre-registration into an actual sign-in log
router.post('/:id/arrive', verifyAdmin, async (req, res) => {
  try {
    const prereg = await prisma.preRegistration.findUnique({
      where: { id: req.params.id },
      include: { visitorGroup: true },
    });
    if (!prereg) return res.status(404).json({ error: 'Not found' });

    const now     = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const log = await prisma.activityLog.create({
      data: {
        siteId:   prereg.siteId,
        memberId: prereg.memberId || null,
        name:     prereg.name,
        userType: prereg.visitorGroup?.name || 'Visitor',
        date:     dateStr,
        timeIn:   timeStr,
        checkIn:  now,
        reason:   prereg.notes || '',
      },
    });

    await prisma.preRegistration.update({
      where: { id: req.params.id },
      data: { status: 'Arrived' },
    });

    res.json({ success: true, log_id: log.id });
  } catch (err) {
    console.error('[POST /api/pre-registrations/:id/arrive]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

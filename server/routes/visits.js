/**
 * /api/visits  — Sign-In-App-style visit timeline
 *
 * Maps cleanly onto the existing ActivityLog table.
 * The frontend ActivityPage calls this endpoint.
 */
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const prisma  = require('../prismaClient');
const { manifestCache, eventBus } = (() => {
  try { return { manifestCache: require('../services/manifestCache'), eventBus: require('../services/eventBus') }; }
  catch { return { manifestCache: null, eventBus: null }; }
})();

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

const formatVisit = (log) => ({
  id:            log.id,
  name:          log.name  || (log.member ? `${log.member.firstName} ${log.member.lastName || ''}`.trim() : ''),
  group:         log.userType || (log.member?.visitorGroup?.name ?? null),
  site:          log.site?.name ?? null,
  site_id:       log.siteId,
  sign_in_time:  log.checkIn ?? (log.date && log.timeIn ? new Date(`${log.date}T${log.timeIn}`) : null),
  sign_out_time: log.checkOut ?? (log.date && log.timeOut ? new Date(`${log.date}T${log.timeOut}`) : null),
  duration:      log.hours ? `${log.hours}h` : (log.duration ? `${Math.round(log.duration / 60 * 10) / 10}h` : null),
  trade:         log.trade,
  car_reg:       log.carReg,
  reason:        log.reason,
  image_url:     log.imageUrl,
  member_id:     log.memberId,
  created_at:    log.createdAt,
});

// ── GET /api/visits ──────────────────────────────────────────────────
// Query params: site_id, date_from, date_to, status (In|Out|All), group, search
router.get('/', verifyAdmin, async (req, res) => {
  const { site_id, date_from, date_to, status, group, search } = req.query;

  try {
    const where = {};

    // Site filter — use first available site if none provided
    if (site_id === 'all') {
      // skip site filtering
    } else if (site_id) {
      where.siteId = site_id;
    } else {
      // Fall back to first site for single-site installs
      const firstSite = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      if (firstSite) where.siteId = firstSite.id;
    }

    // Date range filter
    if (date_from || date_to) {
      where.date = {};
      if (date_from) where.date.gte = date_from;
      if (date_to)   where.date.lte = date_to;
    }

    // Status filter
    if (status === 'In')  where.timeOut = null;
    if (status === 'Out') where.timeOut = { not: null };

    // Group filter
    if (group && group !== 'All') where.userType = group;

    // Search
    if (search) where.name = { contains: search };

    const logs = await prisma.activityLog.findMany({
      where,
      include: { member: { include: { visitorGroup: true } }, site: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    res.json(logs.map(formatVisit));
  } catch (err) {
    console.error('[GET /api/visits]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/visits/public — PUBLIC sign-in from QR Code ──────────────────
router.post('/public', async (req, res) => {
  const { site_id, name, group, trade, car_reg, reason, notes } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    // Resolve site
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const firstSite = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstSite) return res.status(400).json({ error: 'No site found' });
      resolvedSiteId = firstSite.id;
    }

    const now       = new Date();
    const dateStr   = now.toISOString().split('T')[0];
    const timeStr   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const log = await prisma.activityLog.create({
      data: {
        siteId:   resolvedSiteId,
        name:     name.trim(),
        userType: group || 'Visitor',
        trade:    trade || '',
        carReg:   car_reg || '',
        reason:   reason || notes || '',
        date:     dateStr,
        timeIn:   timeStr,
        checkIn:  now,
      },
      include: { site: true },
    });

    // Real-time push to frontend
    const io = req.app.get('io');
    if (io) io.emit('newAttendance', { name: name.trim(), date: dateStr, time_in: timeStr });

    // Update manifest cache if available
    if (manifestCache) {
      const site = await prisma.site.findUnique({ where: { id: resolvedSiteId } });
      if (site) manifestCache.addWorker(site.code, log);
    }

    res.status(201).json({ success: true, visit: formatVisit(log) });
  } catch (err) {
    console.error('[POST /api/visits/public]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/visits/public/:id/sign-out — PUBLIC sign-out from QR flow ────
router.post('/public/:id/sign-out', async (req, res) => {
  try {
    const log = await prisma.activityLog.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: 'Visit not found' });

    const now     = new Date();
    const timeOut = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    let hours = null;
    if (log.timeIn && log.date) {
      const start = new Date(`${log.date}T${log.timeIn}`);
      let ms = now - start;
      if (ms < 0) ms += 86400000;
      hours = parseFloat((ms / 3600000).toFixed(2));
    }

    const updated = await prisma.activityLog.update({
      where: { id: req.params.id },
      data: { timeOut, checkOut: now, hours },
      include: { member: { include: { visitorGroup: true } }, site: true },
    });

    res.json({ success: true, visit: formatVisit(updated) });
  } catch (err) {
    console.error('[POST /api/visits/public/:id/sign-out]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/visits — create a new sign-in ──────────────────────────
router.post('/', verifyAdmin, async (req, res) => {
  const { site_id, member_id, name, group, trade, car_reg, reason, notes } = req.body;

  if (!name && !member_id) return res.status(400).json({ error: 'name or member_id is required' });

  try {
    // Resolve site
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const firstSite = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      if (!firstSite) return res.status(400).json({ error: 'No site found' });
      resolvedSiteId = firstSite.id;
    }

    const now       = new Date();
    const dateStr   = now.toISOString().split('T')[0];
    const timeStr   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // Resolve display name
    let displayName = name;
    if (!displayName && member_id) {
      const m = await prisma.member.findUnique({ where: { id: member_id } });
      if (m) displayName = `${m.firstName} ${m.lastName || ''}`.trim();
    }

    const log = await prisma.activityLog.create({
      data: {
        siteId:   resolvedSiteId,
        memberId: member_id || null,
        name:     displayName,
        userType: group    || 'Visitor',
        trade:    trade    || '',
        carReg:   car_reg  || '',
        reason:   reason   || notes || '',
        date:     dateStr,
        timeIn:   timeStr,
        checkIn:  now,
      },
      include: { member: { include: { visitorGroup: true } }, site: true },
    });

    // Real-time push
    const io = req.app.get('io');
    if (io) io.emit('newAttendance', { name: displayName, date: dateStr, time_in: timeStr });

    // Update manifest cache if available
    if (manifestCache) {
      const site = await prisma.site.findUnique({ where: { id: resolvedSiteId } });
      if (site) manifestCache.addWorker(site.code, log);
    }

    res.status(201).json({ success: true, visit: formatVisit(log) });
  } catch (err) {
    console.error('[POST /api/visits]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/visits/:id/sign-out ────────────────────────────────────
router.post('/:id/sign-out', verifyAdmin, async (req, res) => {
  try {
    const log = await prisma.activityLog.findUnique({ where: { id: req.params.id } });
    if (!log) return res.status(404).json({ error: 'Visit not found' });

    const now     = new Date();
    const timeOut = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    let hours = null;
    if (log.timeIn && log.date) {
      const start = new Date(`${log.date}T${log.timeIn}`);
      let ms = now - start;
      if (ms < 0) ms += 86400000;
      hours = parseFloat((ms / 3600000).toFixed(2));
    }

    const updated = await prisma.activityLog.update({
      where: { id: req.params.id },
      data: { timeOut, checkOut: now, hours },
      include: { member: { include: { visitorGroup: true } }, site: true },
    });

    res.json({ success: true, visit: formatVisit(updated) });
  } catch (err) {
    console.error('[POST /api/visits/:id/sign-out]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/visits/:id ───────────────────────────────────────────
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    await prisma.activityLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/visits/stats ────────────────────────────────────────────
// Returns today's counts for the stat cards
router.get('/stats', verifyAdmin, async (req, res) => {
  const { site_id } = req.query;
  const today = new Date().toISOString().split('T')[0];

  try {
    let resolvedSiteId = site_id;
    if (site_id === 'all') {
      resolvedSiteId = null;
    } else if (!resolvedSiteId) {
      const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      resolvedSiteId = s?.id;
    }

    const where = { date: today };
    if (resolvedSiteId) where.siteId = resolvedSiteId;

    const [totalIn, visitorsIn, employeesIn] = await Promise.all([
      prisma.activityLog.count({ where: { ...where, timeOut: null } }),
      prisma.activityLog.count({ where: { ...where, timeOut: null, userType: 'Visitors' } }),
      prisma.activityLog.count({ where: { ...where, timeOut: null, userType: 'Employees' } }),
    ]);

    res.json({ totalIn, visitorsIn, employeesIn });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

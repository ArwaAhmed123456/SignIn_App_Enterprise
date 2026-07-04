/**
 * /api/attendance — Timesheet / attendance report data
 */
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const prisma  = require('../prismaClient');

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

/**
 * GET /api/attendance/timesheets
 * Query: site_id, group, date_from, date_to, signed_in_only, search
 *
 * Returns rows like Sign In App's Attendance grid:
 * [{ member_id, name, initials, days: { "2026-07-01": { hours, sign_in, sign_out } }, total_hours }]
 */
router.get('/timesheets', verifyAdmin, async (req, res) => {
  const { site_id, group, date_from, date_to, signed_in_only, search } = req.query;

  // Default date range: last 14 days
  const now      = new Date();
  const defTo    = now.toISOString().split('T')[0];
  const defFrom  = new Date(now.getTime() - 13 * 86400000).toISOString().split('T')[0];
  const from     = date_from || defFrom;
  const to       = date_to   || defTo;

  try {
    // Resolve site
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      resolvedSiteId = s?.id;
    }

    const logWhere = { date: { gte: from, lte: to } };
    if (resolvedSiteId) logWhere.siteId = resolvedSiteId;
    if (group && group !== 'All' && group !== 'Employees') logWhere.userType = group;
    if (signed_in_only === 'true') logWhere.timeOut = null;

    const logs = await prisma.activityLog.findMany({
      where: logWhere,
      include: { member: true },
      orderBy: { date: 'asc' },
    });

    // Group logs by member/name
    const memberMap = new Map(); // key = memberId or name

    for (const log of logs) {
      const key      = log.memberId || log.name || 'Unknown';
      const name     = log.name || (log.member ? `${log.member.firstName} ${log.member.lastName || ''}`.trim() : 'Unknown');
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

      if (!memberMap.has(key)) {
        memberMap.set(key, { member_id: log.memberId, name, initials, days: {}, total_hours: 0 });
      }

      const entry = memberMap.get(key);
      if (log.date) {
        entry.days[log.date] = {
          hours:     log.hours ?? 0,
          sign_in:   log.timeIn  ?? null,
          sign_out:  log.timeOut ?? null,
          log_id:    log.id,
          signed_in: !log.timeOut,
        };
        entry.total_hours += log.hours ?? 0;
      }
    }

    // Apply search filter
    let rows = Array.from(memberMap.values());
    if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

    // Round total hours
    rows.forEach(r => { r.total_hours = Math.round(r.total_hours * 100) / 100; });

    res.json({ date_from: from, date_to: to, rows });
  } catch (err) {
    console.error('[GET /api/attendance/timesheets]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/attendance/export
 * Returns CSV of timesheet data (same filters as timesheets endpoint)
 */
router.get('/export', verifyAdmin, async (req, res) => {
  const { site_id, group, date_from, date_to, search } = req.query;

  const now  = new Date();
  const to   = date_to   || now.toISOString().split('T')[0];
  const from = date_from || new Date(now.getTime() - 13 * 86400000).toISOString().split('T')[0];

  try {
    let resolvedSiteId = site_id;
    if (!resolvedSiteId) {
      const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
      resolvedSiteId = s?.id;
    }

    const logWhere = { date: { gte: from, lte: to } };
    if (resolvedSiteId) logWhere.siteId = resolvedSiteId;
    if (group && group !== 'All') logWhere.userType = group;

    const logs = await prisma.activityLog.findMany({
      where: logWhere,
      include: { site: true },
      orderBy: [{ date: 'asc' }, { timeIn: 'asc' }],
    });

    let csv = 'Name,Site,Group,Date,Sign In,Sign Out,Hours\n';
    for (const l of logs) {
      const name = (l.name || '').replace(/,/g, ' ');
      const site = (l.site?.name || '').replace(/,/g, ' ');
      csv += `${name},${site},${l.userType || ''},${l.date || ''},${l.timeIn || ''},${l.timeOut || ''},${l.hours ?? ''}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${from}_to_${to}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

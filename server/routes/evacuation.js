/**
 * /api/evacuation — Start, end and list evacuation reports
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
    if (!['admin', 'superadmin'].includes(decoded.role)) return res.status(403).json({ error: 'Admin only' });
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

const getActorName = (user) =>
  `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatReport = (report) => {
  const participants = parseJson(report.participantsJson, []);
  const notifications = parseJson(report.notificationsJson, []);
  const accountedFor = report.accountedFor
    || `${participants.filter((participant) => participant.safe).length} of ${participants.length} present`;

  return {
    id: report.id,
    site_id: report.siteId,
    site_name: report.site?.name || 'My site',
    status: report.status,
    started_at: report.startedAt,
    started_by: report.startedBy,
    ended_at: report.endedAt,
    ended_by: report.endedBy,
    duration_s: report.durationSeconds,
    accounted_for: accountedFor,
    leave_report: report.leaveReport || '',
    notifications,
    participants,
  };
};

const getResolvedSite = async (siteId) => {
  if (siteId) {
    return prisma.site.findUnique({ where: { id: siteId } });
  }
  return prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
};

// ── GET /api/evacuation/reports?site_id= ──────────────────────────────
router.get('/reports', verifyAdmin, async (req, res) => {
  const { site_id } = req.query;
  try {
    const site = await getResolvedSite(site_id);

    const reports = await prisma.evacuationReport.findMany({
      where: {
        status: 'Completed',
        ...(site?.id ? { siteId: site.id } : {}),
      },
      include: { site: true },
      orderBy: { startedAt: 'desc' },
    });

    res.json(reports.map(formatReport));
  } catch (err) {
    console.error('[GET /api/evacuation/reports]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/evacuation/active?site_id= ───────────────────────────────
router.get('/active', verifyAdmin, async (req, res) => {
  const { site_id } = req.query;
  try {
    const site = await getResolvedSite(site_id);
    const active = site?.id
      ? await prisma.evacuationReport.findFirst({
        where: { siteId: site.id, status: 'Active' },
        include: { site: true },
        orderBy: { startedAt: 'desc' },
      })
      : null;

    res.json({ active: active ? formatReport(active) : null });
  } catch (err) {
    console.error('[GET /api/evacuation/active]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/evacuation/start ────────────────────────────────────────
router.post('/start', verifyAdmin, async (req, res) => {
  const { site_id } = req.body;
  try {
    const site = await getResolvedSite(site_id);
    if (!site?.id) return res.status(400).json({ error: 'No site found' });

    const activeExisting = await prisma.evacuationReport.findFirst({
      where: { siteId: site.id, status: 'Active' },
      include: { site: true },
      orderBy: { startedAt: 'desc' },
    });
    if (activeExisting) {
      return res.status(409).json({ error: 'An evacuation is already active for this site', evacuation: formatReport(activeExisting) });
    }

    // Get everyone currently signed in
    const today = new Date().toISOString().split('T')[0];
    const signedIn = await prisma.activityLog.findMany({
      where: { siteId: site.id, date: today, timeOut: null },
      select: { id: true, name: true, userType: true },
    });

    const participants = signedIn.map((participant) => ({
      log_id: participant.id,
      name: participant.name || 'Unknown',
      group: participant.userType || '—',
      safe: false,
      marked_by: null,
      marked_at: null,
    }));

    const evacuation = await prisma.evacuationReport.create({
      data: {
        siteId: site.id,
        status: 'Active',
        startedBy: getActorName(req.user),
        participantsJson: JSON.stringify(participants),
        notificationsJson: JSON.stringify([]),
      },
      include: { site: true },
    });

    // Notify via socket if available
    const io = req.app.get('io');
    if (io) io.emit('evacuationStarted', { site_id: site.id, site_name: site.name });

    res.status(201).json({ success: true, evacuation: formatReport(evacuation) });
  } catch (err) {
    console.error('[evacuation/start]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/evacuation/mark-safe ────────────────────────────────────
router.post('/mark-safe', verifyAdmin, async (req, res) => {
  const { site_id, participant_id, safe } = req.body;
  try {
    const site = await getResolvedSite(site_id);
    const evac = site?.id
      ? await prisma.evacuationReport.findFirst({
        where: { siteId: site.id, status: 'Active' },
        include: { site: true },
        orderBy: { startedAt: 'desc' },
      })
      : null;

    if (!evac) return res.status(404).json({ error: 'No active evacuation' });

    const markedBy = getActorName(req.user);
    const participants = parseJson(evac.participantsJson, []).map((participant) =>
      participant.log_id === participant_id
        ? { ...participant, safe: safe !== false, marked_by: markedBy, marked_at: new Date().toISOString() }
        : participant
    );

    const updated = await prisma.evacuationReport.update({
      where: { id: evac.id },
      data: {
        participantsJson: JSON.stringify(participants),
        accountedFor: `${participants.filter((participant) => participant.safe).length} of ${participants.length} present`,
      },
      include: { site: true },
    });

    res.json({ success: true, evacuation: formatReport(updated) });
  } catch (err) {
    console.error('[POST /api/evacuation/mark-safe]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/evacuation/notify ───────────────────────────────────────
router.post('/notify', verifyAdmin, async (req, res) => {
  const { site_id, message } = req.body;
  try {
    const site = await getResolvedSite(site_id);
    const evac = site?.id
      ? await prisma.evacuationReport.findFirst({
        where: { siteId: site.id, status: 'Active' },
        include: { site: true },
        orderBy: { startedAt: 'desc' },
      })
      : null;

    if (!evac) return res.status(404).json({ error: 'No active evacuation' });

    const notifications = parseJson(evac.notificationsJson, []);
    const entry = {
      id: `${Date.now()}`,
      message: message?.trim() || 'Evacuation notification sent',
      sent_at: new Date().toISOString(),
      sent_by: getActorName(req.user),
    };

    const updated = await prisma.evacuationReport.update({
      where: { id: evac.id },
      data: { notificationsJson: JSON.stringify([entry, ...notifications]) },
      include: { site: true },
    });

    const io = req.app.get('io');
    if (io) io.emit('evacuationNotification', { site_id: site.id, site_name: site.name, notification: entry });

    res.json({ success: true, evacuation: formatReport(updated), notification: entry });
  } catch (err) {
    console.error('[POST /api/evacuation/notify]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/evacuation/leave-report ──────────────────────────────────
router.put('/leave-report', verifyAdmin, async (req, res) => {
  const { site_id, leave_report } = req.body;
  try {
    const site = await getResolvedSite(site_id);
    const evac = site?.id
      ? await prisma.evacuationReport.findFirst({
        where: { siteId: site.id, status: 'Active' },
        include: { site: true },
        orderBy: { startedAt: 'desc' },
      })
      : null;

    if (!evac) return res.status(404).json({ error: 'No active evacuation' });

    const updated = await prisma.evacuationReport.update({
      where: { id: evac.id },
      data: { leaveReport: leave_report || '' },
      include: { site: true },
    });

    res.json({ success: true, evacuation: formatReport(updated) });
  } catch (err) {
    console.error('[PUT /api/evacuation/leave-report]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/evacuation/end ──────────────────────────────────────────
router.post('/end', verifyAdmin, async (req, res) => {
  const { site_id } = req.body;
  try {
    const site = await getResolvedSite(site_id);
    const evac = site?.id
      ? await prisma.evacuationReport.findFirst({
        where: { siteId: site.id, status: 'Active' },
        include: { site: true },
        orderBy: { startedAt: 'desc' },
      })
      : null;

    if (!evac) return res.status(404).json({ error: 'No active evacuation' });

    const participants = parseJson(evac.participantsJson, []);
    const endedAt = new Date();
    const report = await prisma.evacuationReport.update({
      where: { id: evac.id },
      data: {
        status: 'Completed',
        endedAt,
        endedBy: getActorName(req.user),
        durationSeconds: Math.round((endedAt.getTime() - new Date(evac.startedAt).getTime()) / 1000),
        accountedFor: `${participants.filter((participant) => participant.safe).length} of ${participants.length} present`,
      },
      include: { site: true },
    });

    res.json({ success: true, report: formatReport(report) });
  } catch (err) {
    console.error('[POST /api/evacuation/end]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

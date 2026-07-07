const express     = require('express');
const router      = express.Router();
const jwt         = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const Site        = require('../models/Site');
const Member      = require('../models/Member');
const path        = require('path');
const fs          = require('fs');
const { addWorker } = require('../services/manifestCache');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try {
    const d = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (!['admin', 'superadmin', 'guard', 'manager'].includes(d.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.user = d;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const verifyStrictAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try {
    const d = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    if (!['admin', 'superadmin'].includes(d.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = d;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const fmt = (l, siteNameMap = {}) => ({
  id: l._id, name: l.name, group: l.userType,
  site: siteNameMap[String(l.siteId)] || l.siteName || String(l.siteId),
  site_id: l.siteId, sign_in_time: l.checkIn, sign_out_time: l.checkOut,
  duration: l.hours ? `${l.hours}h` : null, trade: l.trade, car_reg: l.carReg,
  reason: l.reason, image_url: l.imageUrl, member_id: l.memberId, created_at: l.createdAt,
  pre_registered: l.preRegistered || false,
  checked_in_by_guard: l.checkedInByGuard || false,
  checked_in_by: l.checkedInBy || '',
});

const nowStr = () => { const n=new Date(); return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; };

// Save base64 photo to disk and return URL
const savePhoto = (base64Data, siteCode) => {
  try {
    if (!base64Data || !base64Data.startsWith('data:image')) return null;
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return null;
    const ext = matches[1];
    const data = matches[2];
    const dir = path.join(__dirname, '..', 'uploads', siteCode || 'visitors');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `visitor-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(data, 'base64'));
    return `/uploads/${siteCode || 'visitors'}/${filename}`;
  } catch { return null; }
};

// ─── PUBLIC route (no auth) — called by QR visitor check-in page ─────────────
router.post('/public', async (req, res) => {
  const { site_id, name, group, trade, car_reg, reason, photo_base64 } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    // Find site
    const site = await Site.findById(site_id).lean();
    if (!site) return res.status(400).json({ error: 'Site not found' });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = nowStr();

    // Save photo if provided
    const imageUrl = photo_base64 ? savePhoto(photo_base64, site.code) : null;

    const log = await ActivityLog.create({
      siteId: site._id, name: name.trim(),
      userType: group || 'Visitor',
      trade: trade || '', carReg: car_reg || '', reason: reason || '',
      date: dateStr, timeIn: timeStr, checkIn: now,
      imageUrl,
    });

    // Emit socket event so Activity page updates live
    const io = req.app.get('io');
    if (io) io.emit('newAttendance', { name: name.trim(), date: dateStr });

    addWorker(site.code, log);

    res.status(201).json({ success: true, visit: { id: log._id, name: log.name } });
  } catch (err) {
    console.error('Public sign-in error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PUBLIC sign-out (no auth) ────────────────────────────────────────────────
router.post('/public/:id/sign-out', async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Visit not found' });
    const now = new Date();
    let hours = null;
    if (log.timeIn && log.date) {
      const start = new Date(`${log.date}T${log.timeIn}`);
      let ms = now - start;
      if (ms < 0) ms += 86400000;
      hours = parseFloat((ms / 3600000).toFixed(2));
    }
    log.timeOut = nowStr(); log.checkOut = now; log.hours = hours;
    await log.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Public sign-out error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const resolveFirst = async (siteId) => {
  if (siteId && siteId !== 'all') return siteId;
  if (siteId === 'all') return null;
  const s = await Site.findOne().sort({ createdAt: 1 }).lean();
  return s?._id || null;
};


// GET /api/visits/stats
router.get('/stats', verifyAdmin, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const sid = await resolveFirst(req.query.site_id);
    const base = { date: today, timeOut: null };
    if (sid) base.siteId = sid;
    const [totalIn, employeesIn] = await Promise.all([
      ActivityLog.countDocuments(base),
      ActivityLog.countDocuments({ ...base, userType: { $in: ['Employee','Employees'] } }),
    ]);
    res.json({ totalIn, employeesIn, visitorsIn: totalIn - employeesIn });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/visits
router.get('/', verifyAdmin, async (req, res) => {
  const { site_id, date_from, date_to, status, group, search } = req.query;
  try {
    const sid = await resolveFirst(site_id);
    const filter = {};
    if (sid) filter.siteId = sid;
    if (date_from || date_to) { filter.date = {}; if (date_from) filter.date.$gte = date_from; if (date_to) filter.date.$lte = date_to; }
    if (status === 'In')  filter.timeOut = null;
    if (status === 'Out') filter.timeOut = { $ne: null };
    if (group && group !== 'All') filter.userType = group;
    if (search) filter.name = new RegExp(search, 'i');
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(500).lean();

    // Build site name lookup map to avoid N+1 queries
    const siteIds = [...new Set(logs.map(l => String(l.siteId)).filter(Boolean))];
    const sites   = await Site.find({ _id: { $in: siteIds } }).lean();
    const siteMap = Object.fromEntries(sites.map(s => [String(s._id), s.name]));

    res.json(logs.map(l => fmt(l, siteMap)));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/visits
router.post('/', async (req, res) => {
  const { site_id, member_id, name, group, trade, car_reg, reason, notes } = req.body;
  if (!name && !member_id) return res.status(400).json({ error: 'name or member_id is required' });
  try {
    const sid = await resolveFirst(site_id);
    if (!sid) return res.status(400).json({ error: 'No site found' });
    const now = new Date(); const dateStr = now.toISOString().split('T')[0];
    let displayName = name;
    if (!displayName && member_id) { const m = await Member.findById(member_id).lean(); if (m) displayName = `${m.firstName} ${m.lastName||''}`.trim(); }
    const log = await ActivityLog.create({ siteId: sid, memberId: member_id||null, name: displayName, userType: group||'Visitor', trade: trade||'', carReg: car_reg||'', reason: reason||notes||'', date: dateStr, timeIn: nowStr(), checkIn: now });
    const io = req.app.get('io'); if (io) io.emit('newAttendance', { name: displayName, date: dateStr });
    const site = await Site.findById(sid).lean(); if (site) addWorker(site.code, log);
    res.status(201).json({ success: true, visit: fmt(log) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/visits/:id/sign-out
router.post('/:id/sign-out', async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Visit not found' });
    const now = new Date(); let hours = null;
    if (log.timeIn && log.date) { const start = new Date(`${log.date}T${log.timeIn}`); let ms = now - start; if (ms<0) ms+=86400000; hours = parseFloat((ms/3600000).toFixed(2)); }
    log.timeOut = nowStr(); log.checkOut = now; log.hours = hours;
    await log.save();
    res.json({ success: true, visit: fmt(log) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/visits/:id
router.delete('/:id', verifyStrictAdmin, async (req, res) => {
  try { await ActivityLog.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

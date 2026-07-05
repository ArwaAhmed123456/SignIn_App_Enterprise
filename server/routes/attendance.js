const express     = require('express');
const router      = express.Router();
const jwt         = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const Site        = require('../models/Site');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';
const verifyAdmin = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try { const d = jwt.verify(auth.split(' ')[1], JWT_SECRET); if (!['admin','superadmin'].includes(d.role)) return res.status(403).json({ error: 'Admin only' }); req.user = d; next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// GET /api/attendance/timesheets
router.get('/timesheets', verifyAdmin, async (req, res) => {
  const { site_id, group, date_from, date_to, signed_in_only, search } = req.query;
  const now = new Date();
  const to   = date_to   || now.toISOString().split('T')[0];
  const from = date_from || new Date(now.getTime()-13*86400000).toISOString().split('T')[0];
  try {
    let sid = site_id && site_id !== 'all' ? site_id : null;
    if (!sid) { const s = await Site.findOne().sort({ createdAt:1 }).lean(); sid = s?._id||null; }
    const filter = { date: { $gte: from, $lte: to } };
    if (sid) filter.siteId = sid;
    if (group && group !== 'All') filter.userType = group;
    if (signed_in_only === 'true') filter.timeOut = null;
    const logs = await ActivityLog.find(filter).sort({ date:1 }).lean();
    const memberMap = new Map();
    for (const log of logs) {
      const key = log.memberId?.toString() || log.name || 'Unknown';
      const name = log.name || 'Unknown';
      const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      if (!memberMap.has(key)) memberMap.set(key, { member_id: log.memberId, name, initials, days:{}, total_hours:0 });
      const entry = memberMap.get(key);
      if (log.date) { entry.days[log.date] = { hours: log.hours??0, sign_in: log.timeIn??null, sign_out: log.timeOut??null, log_id: log._id?.toString(), signed_in: !log.timeOut }; entry.total_hours += log.hours??0; }
    }
    let rows = Array.from(memberMap.values());
    if (search) rows = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    rows.forEach(r => { r.total_hours = Math.round(r.total_hours*100)/100; });
    res.json({ date_from: from, date_to: to, rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/attendance/export
router.get('/export', verifyAdmin, async (req, res) => {
  const { site_id, group, date_from, date_to } = req.query;
  const now = new Date();
  const to   = date_to   || now.toISOString().split('T')[0];
  const from = date_from || new Date(now.getTime()-13*86400000).toISOString().split('T')[0];
  try {
    let sid = site_id && site_id !== 'all' ? site_id : null;
    if (!sid) { const s = await Site.findOne().sort({ createdAt:1 }).lean(); sid = s?._id||null; }
    const filter = { date: { $gte: from, $lte: to } };
    if (sid) filter.siteId = sid;
    if (group && group !== 'All') filter.userType = group;
    const logs = await ActivityLog.find(filter).sort({ date:1, timeIn:1 }).populate('siteId','name').lean();
    let csv = 'Name,Site,Group,Date,Sign In,Sign Out,Hours\n';
    for (const l of logs) csv += `${(l.name||'').replace(/,/g,' ')},${(l.siteId?.name||'').replace(/,/g,' ')},${l.userType||''},${l.date||''},${l.timeIn||''},${l.timeOut||''},${l.hours??''}\n`;
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition',`attachment; filename="attendance_${from}_to_${to}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

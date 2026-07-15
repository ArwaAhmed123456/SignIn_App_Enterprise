const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const Site     = require('../models/Site');
const Member   = require('../models/Member');
const Delivery = require('../models/Delivery');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// Fuzzy matching helpers (kept from original)
function levenshtein(a, b) {
  const m = []; for (let i=0;i<=b.length;i++) m[i]=[i]; for (let j=0;j<=a.length;j++) m[0][j]=j;
  for (let i=1;i<=b.length;i++) for (let j=1;j<=a.length;j++)
    m[i][j] = b[i-1]===a[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[b.length][a.length];
}
function matchScore(text, q) {
  const t=text.toLowerCase(), s=q.toLowerCase();
  if (t.includes(s)) return 100;
  const ws=t.split(/\s+/), qs=s.split(/\s+/);
  let total=0;
  for (const sw of qs) {
    let best=0;
    for (const w of ws) { const d=levenshtein(w,sw); const sc=Math.max(0,100-(d/Math.max(w.length,sw.length)*100)); if(sc>best) best=sc; }
    total+=best;
  }
  return total/qs.length;
}

// ── GET /api/deliveries?site_id=xxx ─────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { site_id } = req.query;
    const filter = {};
    if (site_id && site_id !== 'all') filter.siteId = site_id;
    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(deliveries);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/deliveries ─────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { site_id, recipient, sender, carrier, notes, item_name, description, car_registration, company } = req.body;
  if (!recipient && !item_name) return res.status(400).json({ error: 'item_name is required' });
  try {
    let siteId = site_id;
    if (!siteId) {
      const s = await Site.findOne().sort({ createdAt: 1 }).lean();
      siteId = s?._id;
    }
    if (!siteId) return res.status(400).json({ error: 'No site found' });
    const delivery = await Delivery.create({
      siteId,
      recipient: recipient || item_name,
      sender: sender || '', carrier: carrier || '', notes: notes || description || '',
      itemName: item_name || '', description: description || '',
      carRegistration: car_registration || '', company: company || '',
    });
    res.status(201).json({ success: true, delivery });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/deliveries/:id/collect ────────────────────────────────
router.post('/:id/collect', verifyToken, async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { collected: true, collectedAt: new Date() },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ success: true, delivery });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ── DELETE /api/deliveries/:id ───────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Delivery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/deliveries/ocr-match ──────────────────────────────────
router.post('/ocr-match', async (req, res) => {
  const { raw_text, project_code } = req.body;
  if (!raw_text || !project_code) return res.status(400).json({ error: 'raw_text and project_code required' });
  try {
    const site = await Site.findOne({ code: project_code.trim().toUpperCase() });
    if (!site) return res.status(404).json({ error: 'Project not found' });
    const members = await Member.find({ siteId: site._id }, 'firstName email role').lean();
    const matches = members.map(m => ({ id: m._id, name: m.firstName, email: m.email, role: m.role,
      score: Math.round(matchScore(raw_text, m.firstName)) }))
      .filter(m => m.score > 40).sort((a,b) => b.score-a.score).slice(0,3);
    res.json({ success: true, matches });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

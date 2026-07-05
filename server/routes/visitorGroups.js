const express      = require('express');
const router       = express.Router();
const jwt          = require('jsonwebtoken');
const VisitorGroup = require('../models/VisitorGroup');
const Site         = require('../models/Site');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token provided' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

const fmt = (g) => ({
  id: g._id, _id: g._id,
  siteId: g.siteId, project_id: g.siteId,
  name: g.name, type: g.type, icon: g.icon, color: g.color,
  fields_required:          g.fieldsRequired    ? JSON.parse(g.fieldsRequired)    : [],
  fields_optional:          g.fieldsOptional    ? JSON.parse(g.fieldsOptional)    : [],
  notify_host:              g.notifyHost,
  print_badge:              g.printBadge,
  allow_self_sign_in:       g.allowSelfSignIn,
  pre_registration_required:g.preRegistrationRequired,
  data_retention_days:      g.dataRetentionDays,
  sort_order:               g.sortOrder,
  is_active:                g.isActive,
  member_count:             g.member_count || 0,
  createdAt:                g.createdAt,
});

// GET /api/visitor-groups?project_id=
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  try {
    let resolvedSiteId = project_id;
    if (!resolvedSiteId) {
      const s = await Site.findOne().sort({ createdAt: 1 });
      resolvedSiteId = s?._id;
    }
    const groups = await VisitorGroup.find({ isActive: true, siteId: resolvedSiteId }).sort({ sortOrder: 1, name: 1 });
    // Count members per group
    const Member = require('../models/Member');
    const counts = await Member.aggregate([
      { $match: { visitorGroupId: { $in: groups.map(g => g._id) } } },
      { $group: { _id: '$visitorGroupId', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    res.json(groups.map(g => ({ ...fmt(g), member_count: countMap[g._id.toString()] || 0 })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/visitor-groups
router.post('/', verifyToken, async (req, res) => {
  const { project_id, name, type, icon, color, fields_required, fields_optional,
    notify_host, print_badge, allow_self_sign_in, pre_registration_required,
    data_retention_days, sort_order } = req.body;
  if (!project_id || !name) return res.status(400).json({ error: 'project_id and name are required' });
  try {
    const existing = await VisitorGroup.findOne({ siteId: project_id, name });
    if (existing) return res.status(400).json({ error: 'A group with that name already exists' });
    const group = await VisitorGroup.create({
      siteId: project_id, name, type: type || 'Standard', icon, color,
      fieldsRequired:          JSON.stringify(fields_required || ['name']),
      fieldsOptional:          JSON.stringify(fields_optional || []),
      notifyHost:              notify_host              ?? false,
      printBadge:              print_badge              ?? false,
      allowSelfSignIn:         allow_self_sign_in       ?? true,
      preRegistrationRequired: pre_registration_required ?? false,
      dataRetentionDays:       data_retention_days      || 90,
      sortOrder:               sort_order               || 0,
    });
    res.status(201).json({ success: true, group: fmt(group) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/visitor-groups/:id
router.put('/:id', verifyToken, async (req, res) => {
  const updates = {};
  const map = { name:'name', icon:'icon', color:'color', type:'type',
    notify_host:'notifyHost', print_badge:'printBadge',
    allow_self_sign_in:'allowSelfSignIn', pre_registration_required:'preRegistrationRequired',
    data_retention_days:'dataRetentionDays', sort_order:'sortOrder', is_active:'isActive' };
  for (const [k, v] of Object.entries(map)) {
    if (req.body[k] !== undefined) updates[v] = req.body[k];
  }
  if (req.body.fields_required !== undefined) updates.fieldsRequired = JSON.stringify(req.body.fields_required);
  if (req.body.fields_optional  !== undefined) updates.fieldsOptional  = JSON.stringify(req.body.fields_optional);
  try {
    const group = await VisitorGroup.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json({ success: true, group: fmt(group) });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/visitor-groups/:id  (soft delete)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await VisitorGroup.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Group deactivated' });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/visitor-groups/seed-defaults
router.post('/seed-defaults', verifyToken, async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });
  const defaults = [
    { name:'Employee', type:'Repeat',   icon:'👷', color:'#2b4594', sortOrder:0 },
    { name:'Visitor',  type:'Standard', icon:'👤', color:'#0891b2', sortOrder:1 },
    { name:'Delivery', type:'Delivery', icon:'📦', color:'#d97706', sortOrder:2 },
    { name:'Contractor',type:'Standard',icon:'🔧', color:'#7c3aed', sortOrder:3 },
  ];
  const seeded = [];
  for (const d of defaults) {
    const exists = await VisitorGroup.findOne({ siteId: project_id, name: d.name });
    if (!exists) {
      await VisitorGroup.create({ siteId: project_id, fieldsRequired: '["name"]', fieldsOptional: '[]', ...d });
      seeded.push(d.name);
    }
  }
  res.json({ success: true, seeded });
});

module.exports = router;

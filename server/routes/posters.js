const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const Poster  = require('../models/Poster');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(403).json({ error: 'No token' });
  try { req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// GET /api/posters?site_id=xxx
router.get('/', verifyToken, async (req, res) => {
  const { site_id } = req.query;
  if (!site_id) return res.status(400).json({ error: 'site_id required' });
  try {
    const posters = await Poster.find({ siteId: site_id }).sort({ createdAt: -1 });
    res.json(posters.map(p => ({
      id: p._id, name: p.name, instructions: p.instructions,
      groups: p.groups, hideHostList: p.hideHostList, createdAt: p.createdAt,
    })));
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// POST /api/posters
router.post('/', verifyToken, async (req, res) => {
  const { site_id, name, instructions, groups, hideHostList } = req.body;
  if (!site_id || !name) return res.status(400).json({ error: 'site_id and name required' });
  try {
    const poster = await Poster.create({ siteId: site_id, name, instructions, groups: groups || [], hideHostList: hideHostList || false });
    res.status(201).json({ id: poster._id, name: poster.name, instructions: poster.instructions, groups: poster.groups, createdAt: poster.createdAt });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/posters/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Poster.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;

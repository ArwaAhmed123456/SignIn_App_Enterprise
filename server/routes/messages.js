/**
 * messages.js — In-app guard ↔ manager communication
 * Supports: site-scoped messages, read receipts, real-time via Socket.io
 */
const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// ── Inline Message schema ────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  siteId:    { type: String, required: true, index: true },
  senderId:  { type: String, required: true },
  senderName:{ type: String },
  senderRole:{ type: String },  // guard | manager | admin
  text:      { type: String, required: true },
  type:      { type: String, default: 'message' }, // message | notification | alert
  readBy:    { type: [String], default: [] },       // array of user IDs who read it
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ── Middleware ───────────────────────────────────────────────────────
const verify = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// ── GET /api/messages?site_id=xxx&limit=50 ───────────────────────────
router.get('/', verify, async (req, res) => {
  const siteId = req.query.site_id || req.user.project_id;
  if (!siteId) return res.status(400).json({ error: 'site_id required' });
  try {
    const limit = parseInt(req.query.limit) || 50;
    const msgs = await Message.find({ siteId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(msgs.reverse()); // oldest first
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/messages ────────────────────────────────────────────────
router.post('/', verify, async (req, res) => {
  const { text, site_id, type } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

  const siteId = site_id || req.user.project_id;
  if (!siteId) return res.status(400).json({ error: 'site_id required' });

  try {
    const msg = await Message.create({
      siteId,
      senderId:   req.user.id,
      senderName: req.user.name || req.user.email,
      senderRole: req.user.role || 'guard',
      text:       text.trim(),
      type:       type || 'message',
      readBy:     [req.user.id],
    });

    // Emit via Socket.io for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(`site:${siteId}`).emit('newMessage', {
        id:          msg._id,
        siteId:      msg.siteId,
        senderId:    msg.senderId,
        senderName:  msg.senderName,
        senderRole:  msg.senderRole,
        text:        msg.text,
        type:        msg.type,
        createdAt:   msg.createdAt,
      });
    }

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/messages/:id/read ───────────────────────────────────────
router.post('/:id/read', verify, async (req, res) => {
  try {
    await Message.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/messages/:id ──────────────────────────────────────────
router.delete('/:id', verify, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.senderId !== req.user.id && !['admin','superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Cannot delete others messages' });
    }
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

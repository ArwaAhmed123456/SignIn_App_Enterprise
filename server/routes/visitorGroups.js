const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const VisitorGroup = require('../models/VisitorGroup');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// ── Auth middleware (admin or guard with manage permission) ──────────
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// ── GET /api/visitor-groups?project_id=xxx ───────────────────────────
// Public: mobile kiosk reads group list to build the sign-in flow dynamically
router.get('/', async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    try {
        const groups = await VisitorGroup
            .find({ project_id, is_active: true })
            .sort({ sort_order: 1, name: 1 })
            .lean();
        res.json(groups);
    } catch (err) {
        console.error('[VisitorGroups GET]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/visitor-groups ─────────────────────────────────────────
// Create a new visitor group config for a project (admin only)
router.post('/', verifyToken, async (req, res) => {
    const {
        project_id, name, icon, color,
        fields_required, fields_optional,
        notify_host, print_badge,
        allow_self_sign_in, pre_registration_required,
        data_retention_days, sort_order
    } = req.body;

    if (!project_id || !name) {
        return res.status(400).json({ error: 'project_id and name are required' });
    }

    try {
        const existing = await VisitorGroup.findOne({ project_id, name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) return res.status(400).json({ error: 'A group with that name already exists for this project' });

        const group = new VisitorGroup({
            project_id, name, icon, color,
            fields_required:  fields_required  || ['name', 'company'],
            fields_optional:  fields_optional  || ['car_reg', 'reason'],
            notify_host:               notify_host              ?? false,
            print_badge:               print_badge              ?? false,
            allow_self_sign_in:        allow_self_sign_in       ?? true,
            pre_registration_required: pre_registration_required ?? false,
            data_retention_days:       data_retention_days       || 90,
            sort_order:                sort_order                 || 0
        });

        await group.save();
        res.status(201).json({ success: true, group });
    } catch (err) {
        console.error('[VisitorGroups POST]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/visitor-groups/:id ──────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    const allowed = [
        'name', 'icon', 'color',
        'fields_required', 'fields_optional',
        'notify_host', 'print_badge',
        'allow_self_sign_in', 'pre_registration_required',
        'data_retention_days', 'sort_order', 'is_active'
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    try {
        const group = await VisitorGroup.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json({ success: true, group });
    } catch (err) {
        console.error('[VisitorGroups PUT]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/visitor-groups/:id ──────────────────────────────────
// Soft-delete (set is_active: false) to preserve audit trail
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const group = await VisitorGroup.findByIdAndUpdate(
            req.params.id,
            { is_active: false },
            { new: true }
        );
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json({ success: true, message: 'Group deactivated' });
    } catch (err) {
        console.error('[VisitorGroups DELETE]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/visitor-groups/seed-defaults ───────────────────────────
// Convenience: seed the 4 default groups for a new project
router.post('/seed-defaults', verifyToken, async (req, res) => {
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const defaults = [
        {
            name: 'Employee', icon: '👷', color: '#2b4594', sort_order: 0,
            fields_required: ['name', 'company', 'car_reg'],
            fields_optional: ['reason', 'photo'],
            notify_host: false, allow_self_sign_in: true
        },
        {
            name: 'Visitor', icon: '👤', color: '#0891b2', sort_order: 1,
            fields_required: ['name', 'company'],
            fields_optional: ['car_reg', 'reason', 'photo'],
            notify_host: true, allow_self_sign_in: true
        },
        {
            name: 'Delivery', icon: '📦', color: '#d97706', sort_order: 2,
            fields_required: ['name'],
            fields_optional: ['parcel_ref', 'photo'],
            notify_host: true, allow_self_sign_in: false
        },
        {
            name: 'Contractor', icon: '🔧', color: '#7c3aed', sort_order: 3,
            fields_required: ['name', 'company', 'car_reg'],
            fields_optional: ['reason', 'photo'],
            notify_host: false, allow_self_sign_in: true
        }
    ];

    try {
        const results = [];
        for (const d of defaults) {
            const exists = await VisitorGroup.findOne({ project_id, name: d.name });
            if (!exists) {
                const g = await VisitorGroup.create({ project_id, ...d });
                results.push(g.name);
            }
        }
        res.json({ success: true, seeded: results });
    } catch (err) {
        console.error('[VisitorGroups SEED]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

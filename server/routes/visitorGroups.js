const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const prisma  = require('../prismaClient');

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

const formatGroup = (group) => {
    return {
        ...group,
        _id: group.id,
        project_id: group.siteId,
        fields_required: group.fieldsRequired ? JSON.parse(group.fieldsRequired) : [],
        fields_optional: group.fieldsOptional ? JSON.parse(group.fieldsOptional) : [],
        notify_host: group.notifyHost,
        print_badge: group.printBadge,
        allow_self_sign_in: group.allowSelfSignIn,
        pre_registration_required: group.preRegistrationRequired,
        data_retention_days: group.dataRetentionDays,
        sort_order: group.sortOrder,
        is_active: group.isActive
    };
};

// ── GET /api/visitor-groups ──────────────────────────────────────────
// Query: project_id (optional) — if omitted returns groups for the first site
router.get('/', async (req, res) => {
    const { project_id } = req.query;

    try {
        let resolvedSiteId = project_id;
        if (!resolvedSiteId) {
            const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
            resolvedSiteId = s?.id;
        }

        const groups = await prisma.visitorGroup.findMany({
            where: { isActive: true, OR: [ { siteId: resolvedSiteId }, { accountId: null, siteId: null } ] },
            include: { _count: { select: { members: true } } },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });

        res.json(groups.map(g => ({
            ...formatGroup(g),
            member_count: g._count.members,
        })));
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
        const existing = await prisma.visitorGroup.findFirst({
            where: {
                siteId: project_id,
                name: { equals: name }
            }
        });
        if (existing) return res.status(400).json({ error: 'A group with that name already exists for this project' });

        const group = await prisma.visitorGroup.create({
            data: {
                siteId: project_id,
                name,
                icon,
                color,
                fieldsRequired: JSON.stringify(fields_required || ['name', 'company']),
                fieldsOptional: JSON.stringify(fields_optional || ['car_reg', 'reason']),
                notifyHost: notify_host ?? false,
                printBadge: print_badge ?? false,
                allowSelfSignIn: allow_self_sign_in ?? true,
                preRegistrationRequired: pre_registration_required ?? false,
                dataRetentionDays: data_retention_days || 90,
                sortOrder: sort_order || 0
            }
        });

        res.status(201).json({ success: true, group: formatGroup(group) });
    } catch (err) {
        console.error('[VisitorGroups POST]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/visitor-groups/:id ──────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
    const allowedMap = {
        name: 'name', icon: 'icon', color: 'color',
        fields_required: 'fieldsRequired', fields_optional: 'fieldsOptional',
        notify_host: 'notifyHost', print_badge: 'printBadge',
        allow_self_sign_in: 'allowSelfSignIn', pre_registration_required: 'preRegistrationRequired',
        data_retention_days: 'dataRetentionDays', sort_order: 'sortOrder', is_active: 'isActive'
    };
    
    const updates = {};
    for (const [reqKey, prismaKey] of Object.entries(allowedMap)) {
        if (req.body[reqKey] !== undefined) {
            if (reqKey === 'fields_required' || reqKey === 'fields_optional') {
                updates[prismaKey] = JSON.stringify(req.body[reqKey]);
            } else {
                updates[prismaKey] = req.body[reqKey];
            }
        }
    }

    try {
        const group = await prisma.visitorGroup.update({
            where: { id: req.params.id },
            data: updates
        });
        res.json({ success: true, group: formatGroup(group) });
    } catch (err) {
        console.error('[VisitorGroups PUT]', err);
        if (err.code === 'P2025') return res.status(404).json({ error: 'Group not found' });
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/visitor-groups/:id ──────────────────────────────────
// Soft-delete (set is_active: false) to preserve audit trail
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.visitorGroup.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        res.json({ success: true, message: 'Group deactivated' });
    } catch (err) {
        console.error('[VisitorGroups DELETE]', err);
        if (err.code === 'P2025') return res.status(404).json({ error: 'Group not found' });
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
            name: 'Employee', icon: '👷', color: '#2b4594', sortOrder: 0,
            fieldsRequired: JSON.stringify(['name', 'company', 'car_reg']),
            fieldsOptional: JSON.stringify(['reason', 'photo']),
            notifyHost: false, allowSelfSignIn: true
        },
        {
            name: 'Visitor', icon: '👤', color: '#0891b2', sortOrder: 1,
            fieldsRequired: JSON.stringify(['name', 'company']),
            fieldsOptional: JSON.stringify(['car_reg', 'reason', 'photo']),
            notifyHost: true, allowSelfSignIn: true
        },
        {
            name: 'Delivery', icon: '📦', color: '#d97706', sortOrder: 2,
            fieldsRequired: JSON.stringify(['name']),
            fieldsOptional: JSON.stringify(['parcel_ref', 'photo']),
            notifyHost: true, allowSelfSignIn: false
        },
        {
            name: 'Contractor', icon: '🔧', color: '#7c3aed', sortOrder: 3,
            fieldsRequired: JSON.stringify(['name', 'company', 'car_reg']),
            fieldsOptional: JSON.stringify(['reason', 'photo']),
            notifyHost: false, allowSelfSignIn: true
        }
    ];

    try {
        const results = [];
        for (const d of defaults) {
            const exists = await prisma.visitorGroup.findFirst({
                where: { siteId: project_id, name: d.name }
            });
            if (!exists) {
                const g = await prisma.visitorGroup.create({
                    data: { siteId: project_id, ...d }
                });
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

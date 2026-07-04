const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const prisma   = require('../prismaClient');
const { sendMobileInviteEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// ── Middleware ───────────────────────────────────────────────────────
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (!['admin', 'superadmin'].includes(decoded.role)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });
    try {
        req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// ── POST /api/guards/signup ──────────────────────────────────────────
router.post('/signup', async (req, res) => {
    const { name, email, password, phone, project_id } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    try {
        const existing = await prisma.member.findFirst({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await prisma.member.create({
            data: {
                firstName: name, // Legacy mapping
                email,
                password: hashedPassword,
                phone:    phone || null,   // Mobile / phone number (optional)
                siteId:   project_id || null,
                role:     'guard'
            }
        });
        res.status(201).json({ success: true, message: 'Guard account created successfully' });
    } catch (err) {
        console.error('Guard Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/guards/login ───────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const guard = await prisma.member.findFirst({
            where: { email: { equals: email.trim() } }
        });
        if (!guard || !guard.password) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, guard.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: guard.id, email: guard.email, role: guard.role || 'guard', permissions: guard.permissions ? JSON.parse(guard.permissions) : null },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            success: true, token,
            user: {
                name: guard.firstName, email: guard.email,
                phone: guard.phone || null,
                role: guard.role || 'guard',
                project_id: guard.siteId,
                permissions: guard.permissions ? JSON.parse(guard.permissions) : null
            }
        });
    } catch (err) {
        console.error('Guard Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/guards ──────────────────────────────────────────────────
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const guards = await prisma.member.findMany({
            where: { role: 'guard' },
            include: { site: true },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = guards.map(g => ({
            id: g.id,
            name: g.firstName,
            email: g.email,
            phone: g.phone,
            role: g.role,
            permissions: g.permissions ? JSON.parse(g.permissions) : null,
            project_id: g.site?.id,
            project_name: g.site?.name,
            project_code: g.site?.code,
            mobile_paired: g.mobilePaired,
            mobile_paired_at: g.mobilePairedAt,
            created_at: g.createdAt
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/guards/:id/assign-project ───────────────────────────────
router.put('/:id/assign-project', verifyAdmin, async (req, res) => {
    try {
        await prisma.member.update({
            where: { id: req.params.id },
            data: { siteId: req.body.project_id || null }
        });
        res.json({ success: true, message: 'Guard assigned to project successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/guards/:id/permissions ─────────────────────────────────
router.put('/:id/permissions', verifyAdmin, async (req, res) => {
    const { role, permissions } = req.body;
    try {
        const updateData = {};
        if (role) updateData.role = role;
        if (permissions) updateData.permissions = JSON.stringify(permissions);

        const guard = await prisma.member.update({
            where: { id: req.params.id },
            data: updateData,
            select: { id: true, firstName: true, email: true, phone: true, role: true, permissions: true, siteId: true, mobilePaired: true }
        });
        
        const responseGuard = {
            ...guard,
            permissions: guard.permissions ? JSON.parse(guard.permissions) : null
        };
        
        res.json({ success: true, guard: responseGuard });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════
// MODULE 2 — MOBILE COMPANION ONBOARDING
// ═══════════════════════════════════════════════════════════════════════

router.post('/:id/generate-mobile-token', verifyAdmin, async (req, res) => {
    try {
        const guard = await prisma.member.findUnique({ where: { id: req.params.id } });
        if (!guard) return res.status(404).json({ error: 'Guard not found' });

        let currentPermissions = guard.permissions ? JSON.parse(guard.permissions) : {};
        if (!currentPermissions.can_mobile_sign_in) {
            currentPermissions.can_mobile_sign_in = true;
        }

        const plainToken = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
        const hash = await bcrypt.hash(plainToken, 10);
        const expiry = new Date(Date.now() + 24 * 3600000); // 24 hours

        await prisma.member.update({
            where: { id: guard.id },
            data: {
                permissions: JSON.stringify(currentPermissions),
                mobileTokenHash: hash,
                mobileTokenExpiry: expiry
            }
        });

        // Email the plain-text token
        // Mapping fields for the emailService expected guard object
        const legacyGuardObj = { name: guard.firstName, email: guard.email };
        const emailResult = await sendMobileInviteEmail(legacyGuardObj, plainToken);

        const preview = `${plainToken.slice(0, 4)}-XXXX-${plainToken.slice(8)}`;

        res.json({
            success: true,
            token_preview: preview,
            expires_at: expiry,
            email_sent: emailResult.success,
            message: `Activation token emailed to ${guard.email}`
        });
    } catch (err) {
        console.error('[generate-mobile-token]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/activate-mobile', async (req, res) => {
    const { token, device_id } = req.body;

    if (!token || !device_id) return res.status(400).json({ error: 'token and device_id are required' });
    if (!/^\d{12}$/.test(token)) return res.status(400).json({ error: 'Token must be exactly 12 digits' });

    try {
        const candidates = await prisma.member.findMany({
            where: {
                mobileTokenExpiry: { gt: new Date() },
                mobilePaired: false
            }
        });

        let matchedGuard = null;
        for (const candidate of candidates) {
            if (candidate.mobileTokenHash) {
                const valid = await bcrypt.compare(token, candidate.mobileTokenHash);
                if (valid) { matchedGuard = candidate; break; }
            }
        }

        if (!matchedGuard) {
            return res.status(401).json({
                error: 'Invalid or expired activation token. Please request a new one from your site manager.'
            });
        }

        await prisma.member.update({
            where: { id: matchedGuard.id },
            data: {
                mobilePaired: true,
                mobileDeviceId: device_id,
                mobilePairedAt: new Date(),
                mobileTokenHash: null,
                mobileTokenExpiry: null
            }
        });

        const mobileJwt = jwt.sign(
            {
                id: matchedGuard.id,
                email: matchedGuard.email,
                role: 'mobile_employee',
                project_id: matchedGuard.siteId,
                device_id,
                permissions: matchedGuard.permissions ? JSON.parse(matchedGuard.permissions) : null
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: `Welcome, ${matchedGuard.firstName}! Your device has been paired.`,
            jwt_token: mobileJwt,
            guard: {
                id: matchedGuard.id,
                name: matchedGuard.firstName,
                email: matchedGuard.email,
                phone: matchedGuard.phone || null,
                project_id: matchedGuard.siteId,
                permissions: matchedGuard.permissions ? JSON.parse(matchedGuard.permissions) : null
            }
        });
    } catch (err) {
        console.error('[activate-mobile]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/revoke-mobile', verifyAdmin, async (req, res) => {
    try {
        const guard = await prisma.member.findUnique({ where: { id: req.params.id } });
        let permissions = guard?.permissions ? JSON.parse(guard.permissions) : {};
        permissions.can_mobile_sign_in = false;

        await prisma.member.update({
            where: { id: req.params.id },
            data: {
                mobilePaired: false,
                mobileDeviceId: null,
                mobileTokenHash: null,
                mobileTokenExpiry: null,
                permissions: JSON.stringify(permissions)
            }
        });
        res.json({ success: true, message: 'Mobile access revoked. Device unpaired.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════════════════
// MEMBER MANAGEMENT — add / update / delete / status filtering
// ═══════════════════════════════════════════════════════════════════════

// ── GET /api/guards/members?status=Current|Upcoming|Archived&visitor_group_id=&search= ──
router.get('/members', verifyAdmin, async (req, res) => {
    const { status, visitor_group_id, search, site_id } = req.query;

    try {
        const where = {};
        if (status && status !== 'All')          where.status          = status;
        if (visitor_group_id)                    where.visitorGroupId  = visitor_group_id;
        if (site_id)                             where.siteId          = site_id;
        if (search) where.OR = [
            { firstName: { contains: search } },
            { lastName:  { contains: search } },
            { email:     { contains: search } },
        ];

        const members = await prisma.member.findMany({
            where,
            include: { visitorGroup: true, site: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(members.map(m => ({
            id:              m.id,
            name:            `${m.firstName} ${m.lastName || ''}`.trim(),
            first_name:      m.firstName,
            last_name:       m.lastName,
            email:           m.email,
            phone:           m.phone,
            status:          m.status,
            role:            m.role,
            start_date:      m.startDate,
            end_date:        m.endDate,
            visitor_group:   m.visitorGroup?.name ?? null,
            visitor_group_id:m.visitorGroupId,
            site:            m.site?.name ?? null,
            site_id:         m.siteId,
            mobile_paired:   m.mobilePaired,
            created_at:      m.createdAt,
        })));
    } catch (err) {
        console.error('[GET /api/guards/members]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/guards/members — create member ─────────────────────────
router.post('/members', verifyAdmin, async (req, res) => {
    const { first_name, last_name, email, phone, role, status, start_date, end_date, visitor_group_id, site_id } = req.body;
    if (!first_name) return res.status(400).json({ error: 'first_name is required' });

    try {
        if (email) {
            const existing = await prisma.member.findFirst({ where: { email } });
            if (existing) return res.status(400).json({ error: 'Email already exists' });
        }

        // Resolve site
        let resolvedSiteId = site_id;
        if (!resolvedSiteId) {
            const s = await prisma.site.findFirst({ orderBy: { createdAt: 'asc' } });
            resolvedSiteId = s?.id;
        }

        const member = await prisma.member.create({
            data: {
                firstName:     first_name,
                lastName:      last_name      || null,
                email:         email          || null,
                phone:         phone          || null,
                role:          role           || 'Employee',
                status:        status         || 'Current',
                startDate:     start_date     ? new Date(start_date) : null,
                endDate:       end_date       ? new Date(end_date)   : null,
                visitorGroupId:visitor_group_id || null,
                siteId:        resolvedSiteId,
            },
            include: { visitorGroup: true, site: true },
        });

        res.status(201).json({
            success: true,
            member: {
                id:              member.id,
                name:            `${member.firstName} ${member.lastName || ''}`.trim(),
                email:           member.email,
                phone:           member.phone,
                status:          member.status,
                role:            member.role,
                start_date:      member.startDate,
                end_date:        member.endDate,
                visitor_group:   member.visitorGroup?.name ?? null,
                visitor_group_id:member.visitorGroupId,
                created_at:      member.createdAt,
            }
        });
    } catch (err) {
        console.error('[POST /api/guards/members]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/guards/members/:id — update member ──────────────────────
router.put('/members/:id', verifyAdmin, async (req, res) => {
    const { first_name, last_name, email, phone, role, status, start_date, end_date, visitor_group_id } = req.body;
    try {
        const updates = {};
        if (first_name      !== undefined) updates.firstName     = first_name;
        if (last_name       !== undefined) updates.lastName      = last_name;
        if (email           !== undefined) updates.email         = email;
        if (phone           !== undefined) updates.phone         = phone;
        if (role            !== undefined) updates.role          = role;
        if (status          !== undefined) updates.status        = status;
        if (start_date      !== undefined) updates.startDate     = start_date ? new Date(start_date) : null;
        if (end_date        !== undefined) updates.endDate       = end_date   ? new Date(end_date)   : null;
        if (visitor_group_id!== undefined) updates.visitorGroupId = visitor_group_id;

        const member = await prisma.member.update({
            where: { id: req.params.id },
            data: updates,
            include: { visitorGroup: true },
        });

        res.json({ success: true, member: {
            id:              member.id,
            name:            `${member.firstName} ${member.lastName || ''}`.trim(),
            email:           member.email,
            phone:           member.phone,
            status:          member.status,
            role:            member.role,
            start_date:      member.startDate,
            end_date:        member.endDate,
            visitor_group:   member.visitorGroup?.name ?? null,
            visitor_group_id:member.visitorGroupId,
        }});
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Member not found' });
        res.status(500).json({ error: 'Server error' });
    }
});

// ── DELETE /api/guards/members/:id ───────────────────────────────────
router.delete('/members/:id', verifyAdmin, async (req, res) => {
    try {
        await prisma.member.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'Member not found' });
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/guards/members/:id/archive ─────────────────────────────
router.post('/members/:id/archive', verifyAdmin, async (req, res) => {
    try {
        await prisma.member.update({ where: { id: req.params.id }, data: { status: 'Archived' } });
        res.json({ success: true, message: 'Member archived' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

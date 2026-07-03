const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Guard    = require('../models/Guard');
const Project  = require('../models/Project');
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
    const { name, email, password, project_id } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
    }
    try {
        const existing = await Guard.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const guard = new Guard({ name, email, password, project_id: project_id || null });
        await guard.save(); // password hashed by pre-save hook
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
        const guard = await Guard.findOne({ email: { $regex: new RegExp('^' + email.trim() + '$', 'i') } });
        if (!guard) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, guard.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: guard._id, email: guard.email, role: guard.role || 'guard', permissions: guard.permissions },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            success: true, token,
            user: {
                name: guard.name, email: guard.email,
                role: guard.role || 'guard',
                project_id: guard.project_id,
                permissions: guard.permissions
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
        const guards = await Guard.find()
            .select('-password -mobile_token_hash')
            .populate('project_id')
            .sort({ created_at: -1 });

        const formatted = guards.map(g => ({
            id: g._id,
            name: g.name,
            email: g.email,
            phone: g.phone,
            role: g.role,
            permissions: g.permissions,
            project_id: g.project_id?._id,
            project_name: g.project_id?.name,
            project_code: g.project_id?.code,
            mobile_paired: g.mobile_paired,
            mobile_paired_at: g.mobile_paired_at,
            created_at: g.created_at
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/guards/:id/assign-project ───────────────────────────────
router.put('/:id/assign-project', verifyAdmin, async (req, res) => {
    try {
        await Guard.findByIdAndUpdate(req.params.id, { project_id: req.body.project_id || null });
        res.json({ success: true, message: 'Guard assigned to project successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ── PUT /api/guards/:id/permissions ─────────────────────────────────
// Admin sets granular permissions per guard
router.put('/:id/permissions', verifyAdmin, async (req, res) => {
    const { role, permissions } = req.body;
    try {
        const update = {};
        if (role) update.role = role;
        if (permissions) update.permissions = permissions;

        const guard = await Guard.findByIdAndUpdate(req.params.id, update, { new: true })
            .select('-password -mobile_token_hash');
        if (!guard) return res.status(404).json({ error: 'Guard not found' });
        res.json({ success: true, guard });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════════════════════
// MODULE 2 — MOBILE COMPANION ONBOARDING
// ═══════════════════════════════════════════════════════════════════════

// ── POST /api/guards/:id/generate-mobile-token ───────────────────────
// Admin grants a guard mobile access. Generates a 12-digit single-use token,
// emails it to the guard, and returns a preview to the admin.
router.post('/:id/generate-mobile-token', verifyAdmin, async (req, res) => {
    try {
        const guard = await Guard.findById(req.params.id);
        if (!guard) return res.status(404).json({ error: 'Guard not found' });

        if (!guard.permissions?.can_mobile_sign_in) {
            // Auto-enable mobile access when generating a token
            guard.permissions = { ...(guard.permissions?.toObject?.() || {}), can_mobile_sign_in: true };
        }

        // Generate token using the model method (returns plain-text ONCE)
        const plainToken = await guard.generateMobileToken();
        await guard.save();

        // Email the plain-text token to the guard
        const emailResult = await sendMobileInviteEmail(guard, plainToken);

        // Return a redacted preview to the admin UI (first 4 + last 4 digits)
        const preview = `${plainToken.slice(0, 4)}-XXXX-${plainToken.slice(8)}`;

        res.json({
            success: true,
            token_preview: preview,
            expires_at: guard.mobile_token_expiry,
            email_sent: emailResult.success,
            message: `Activation token emailed to ${guard.email}`
        });
    } catch (err) {
        console.error('[generate-mobile-token]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/guards/activate-mobile ────────────────────────────────
// Called by the mobile app during first-time setup.
// Consumes the 12-digit token, pairs the device, issues a 30-day mobile JWT.
// PUBLIC endpoint — no auth header required.
router.post('/activate-mobile', async (req, res) => {
    const { token, device_id } = req.body;

    if (!token || !device_id) {
        return res.status(400).json({ error: 'token and device_id are required' });
    }

    if (!/^\d{12}$/.test(token)) {
        return res.status(400).json({ error: 'Token must be exactly 12 digits' });
    }

    try {
        // Find guards with a valid (non-expired) token hash
        const candidates = await Guard.find({
            mobile_token_expiry: { $gt: new Date() },
            mobile_paired: false
        });

        let matchedGuard = null;
        for (const candidate of candidates) {
            const valid = await candidate.verifyMobileToken(token);
            if (valid) { matchedGuard = candidate; break; }
        }

        if (!matchedGuard) {
            return res.status(401).json({
                error: 'Invalid or expired activation token. Please request a new one from your site manager.'
            });
        }

        // Pair the device — clear token (single-use)
        matchedGuard.mobile_paired    = true;
        matchedGuard.mobile_device_id = device_id;
        matchedGuard.mobile_paired_at = new Date();
        matchedGuard.mobile_token_hash   = undefined;
        matchedGuard.mobile_token_expiry = undefined;
        await matchedGuard.save();

        // Issue a long-lived mobile JWT (30 days)
        const mobileJwt = jwt.sign(
            {
                id:    matchedGuard._id,
                email: matchedGuard.email,
                role:  'mobile_employee',
                project_id:   matchedGuard.project_id,
                device_id,
                permissions:  matchedGuard.permissions
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: `Welcome, ${matchedGuard.name}! Your device has been paired.`,
            jwt_token: mobileJwt,
            guard: {
                id:         matchedGuard._id,
                name:       matchedGuard.name,
                email:      matchedGuard.email,
                project_id: matchedGuard.project_id,
                permissions: matchedGuard.permissions
            }
        });
    } catch (err) {
        console.error('[activate-mobile]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── POST /api/guards/revoke-mobile ───────────────────────────────────
// Admin can un-pair a device (e.g. lost phone)
router.post('/:id/revoke-mobile', verifyAdmin, async (req, res) => {
    try {
        await Guard.findByIdAndUpdate(req.params.id, {
            mobile_paired:       false,
            mobile_device_id:    null,
            mobile_token_hash:   null,
            mobile_token_expiry: null,
            'permissions.can_mobile_sign_in': false
        });
        res.json({ success: true, message: 'Mobile access revoked. Device unpaired.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');
const Member   = require('../models/Member');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// ─── Middleware ───────────────────────────────────────────────────────────────
const verifySuperAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    try {
        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin   = await Admin.findById(decoded.id);
        if (!admin || admin.role !== 'superadmin')
            return res.status(403).json({ error: 'Access denied. Super Admin only.' });
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    try {
        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email and password required' });

    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin)
            return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            {
                id:        admin._id,
                email:     admin.email,
                role:      admin.role,
                site_id:   admin.site_id ? String(admin.site_id) : null,
                firstName: admin.first_name || '',
                lastName:  admin.last_name  || '',
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                email:        admin.email,
                role:         admin.role,
                firstName:    admin.first_name    || '',
                lastName:     admin.last_name     || '',
                organization: admin.organization  || '',
                // Mobile manager screens need this to load their assigned site
                // when the projects list is restricted.
                site_id:      admin.site_id ? String(admin.site_id) : null,
                project_id:   admin.site_id ? String(admin.site_id) : null,
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Signup (open for first superadmin, superadmin-only thereafter) ───────────
router.post('/signup', async (req, res) => {
    const { email, password, first_name, last_name, phone, organization } = req.body;
    if (!email || !password || !first_name || !last_name)
        return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    try {
        // Check if any superadmin exists
        const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            // Not first-time setup — require superadmin token
            const authHeader = req.headers['authorization'];
            if (!authHeader) return res.status(401).json({ error: 'Superadmin token required' });
            try {
                const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
                const admin = await Admin.findById(decoded.id);
                if (!admin || admin.role !== 'superadmin')
                    return res.status(403).json({ error: 'Access denied. Super Admin only.' });
            } catch {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return res.status(400).json({ error: 'Invalid email format' });
        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'Email already exists' });
        const hashed = await bcrypt.hash(password, 10);
        await Admin.create({
            email: email.toLowerCase(),
            password: hashed,
            first_name, last_name, phone, organization,
            role: existingSuperAdmin ? 'admin' : 'superadmin',
        });
        res.status(201).json({ message: existingSuperAdmin ? 'Admin account created successfully' : 'Super admin account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    try {
        const normalizedEmail = email.toLowerCase().trim();

        // Only allow password resets for Admin + Manager accounts that already exist in DB.
        // - Portal admins live in Admin collection
        // - Mobile managers/admins live in Member collection (mobileRole/role)
        let record = await Admin.findOne({ email: normalizedEmail });
        let accountLabel = 'Admin Portal';

        if (!record) {
            record = await Member.findOne({
                email: normalizedEmail,
                $or: [
                    { mobileRole: { $in: ['manager', 'admin'] } },
                    { role: { $regex: /manager|admin|supervisor/i } },
                ],
            });
            accountLabel = 'Tripod Hub Connect';
        }

        // Product requirement: do not send reset emails for unknown / non-admin accounts.
        if (!record) {
            return res.status(404).json({ error: 'No admin/manager account found for that email.' });
        }

        // A short numeric one-time code is readable and can be entered in the
        // mobile reset form. The server still enforces the expiry below.
        const token   = crypto.randomInt(100000, 1000000).toString();
        // Keep expiry aligned with the email template wording (15 minutes).
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        record.reset_token   = token;
        record.reset_expires = expires;
        await record.save({ validateBeforeSave: false });

        const { sendPasswordResetEmail } = require('../services/emailService');
        await sendPasswordResetEmail(normalizedEmail, accountLabel, token);

        res.json({
            success: true,
            message: 'Reset code sent. Please check your email.',
            mockToken: process.env.NODE_ENV === 'development' ? token : undefined,
        });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
});

// ─── Reset password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    try {
        const tokenFilter = { reset_token: token, reset_expires: { $gt: new Date() } };

        // Search Admin first, then Member
        let record = await Admin.findOne(tokenFilter);
        if (!record) record = await Member.findOne(tokenFilter);
        if (!record) return res.status(400).json({ error: 'Invalid or expired token' });

        record.password      = await bcrypt.hash(newPassword, 10);
        record.reset_token   = undefined;
        record.reset_expires = undefined;
        await record.save({ validateBeforeSave: false });

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Change password ──────────────────────────────────────────────────────────
router.post('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 8)
        return res.status(400).json({ error: 'Password must be at least 8 characters' });

    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const valid = await bcrypt.compare(currentPassword, admin.password);
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

        admin.password = await bcrypt.hash(newPassword, 10);
        await admin.save({ validateBeforeSave: false });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Invite / create portal user (superadmin only) ────────────────────────────
// Returns the generated password so superadmin can share credentials manually
router.post('/invite', verifySuperAdmin, async (req, res) => {
    const { email, role, first_name, last_name, organization, site_id, password, send_email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    try {
        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

        // Password:
        // - If a password was provided by the UI, use it (must be >= 8 chars)
        // - Otherwise generate a readable temp password
        let tempPassword = null;
        if (password && String(password).trim()) {
            const p = String(password).trim();
            if (p.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
            tempPassword = p;
        } else {
            const words = ['Solar', 'Gate', 'Guard', 'Site', 'Access', 'Tripod', 'Horton', 'Rayleigh', 'Secure'];
            const word  = words[Math.floor(Math.random() * words.length)];
            const num   = Math.floor(100 + Math.random() * 900);
            tempPassword = `${word}@${num}!`;
        }

        const hashed = await bcrypt.hash(tempPassword, 10);
        const newAdmin = await Admin.create({
            email:        email.toLowerCase(),
            password:     hashed,
            first_name:   first_name || email.split('@')[0],
            last_name:    last_name  || '',
            organization: organization || '',
            role:         role || 'admin',
            site_id:      site_id || null,
        });

        let emailSent = false;
        const shouldSendEmail = send_email !== false;
        if (shouldSendEmail) {
            try {
                const { sendAdminCredentialsEmail } = require('../services/emailService');
                const result = await sendAdminCredentialsEmail({
                    email:        email.toLowerCase(),
                    firstName:    first_name || email.split('@')[0],
                    tempPassword: tempPassword,
                    role:         role || 'admin',
                });
                emailSent = result?.success || false;
            } catch (emailErr) {
                console.warn('Could not send credentials email:', emailErr.message);
            }
        }

        res.status(201).json({
            message:    shouldSendEmail
                ? (emailSent ? 'Account created and credentials sent by email' : 'Account created (email delivery pending)')
                : 'Account created (email not sent)',
            password:   tempPassword,
            email_sent: emailSent,
            user: {
                id:     newAdmin._id,
                email:  newAdmin.email,
                role:   newAdmin.role,
                status: 'active',
            }
        });
    } catch (err) {
        console.error('Invite error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── List admins ───────────────────────────────────────────────────────────────
router.get('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password -reset_token -reset_expires').populate('site_id', 'name');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Update admin (superadmin only) ──────────────────────────────────────────
router.put('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const { role, site_id, first_name, last_name } = req.body;
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        if (admin.role === 'superadmin')
            return res.status(400).json({ error: 'Cannot modify superadmin' });
        const updates = {};
        if (role       !== undefined) updates.role       = role;
        if (site_id    !== undefined) updates.site_id    = site_id || null;
        if (first_name !== undefined) updates.first_name = first_name;
        if (last_name  !== undefined) updates.last_name  = last_name;
        const updated = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('site_id', 'name');
        res.json({ message: 'Admin updated', admin: updated });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Delete admin ─────────────────────────────────────────────────────────────
router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        if (admin.role === 'superadmin')
            return res.status(400).json({ error: 'Cannot delete superadmin' });
        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

const Guard  = require('../models/Guard');

// ─── Delete Account (User Self-Service for Apple 5.1.1 Compliance) ────────────
const handleDeleteAccount = async (req, res) => {
    try {
        const userId    = req.user?.id;
        const userEmail = req.user?.email ? req.user.email.toLowerCase().trim() : null;

        console.log(`[DeleteAccount] Attempting deletion — userId: ${userId}, email: ${userEmail}`);

        if (!userId && !userEmail) {
            return res.status(400).json({ error: 'User identification missing' });
        }

        let deleted = false;

        // 1. Try deleting from Member collection (guards, employees, managers)
        if (userId) {
            const member = await Member.findByIdAndDelete(userId);
            if (member) {
                console.log(`[DeleteAccount] Deleted Member by ID: ${userId}`);
                deleted = true;
            }
        }
        if (!deleted && userEmail) {
            const member = await Member.findOneAndDelete({ email: userEmail });
            if (member) {
                console.log(`[DeleteAccount] Deleted Member by email: ${userEmail}`);
                deleted = true;
            }
        }

        // 2. Try deleting from legacy Guard collection
        if (!deleted && userId) {
            const guard = await Guard.findByIdAndDelete(userId);
            if (guard) {
                console.log(`[DeleteAccount] Deleted Guard by ID: ${userId}`);
                deleted = true;
            }
        }
        if (!deleted && userEmail) {
            const guard = await Guard.findOneAndDelete({ email: userEmail });
            if (guard) {
                console.log(`[DeleteAccount] Deleted Guard by email: ${userEmail}`);
                deleted = true;
            }
        }

        // 3. Try deleting from Admin collection (non-superadmin only)
        if (!deleted && userId) {
            const admin = await Admin.findById(userId);
            if (admin) {
                if (admin.role === 'superadmin') {
                    return res.status(400).json({ error: 'Superadmin account cannot be deleted via app self-service' });
                }
                await Admin.findByIdAndDelete(userId);
                console.log(`[DeleteAccount] Deleted Admin by ID: ${userId}`);
                deleted = true;
            }
        }
        if (!deleted && userEmail) {
            const admin = await Admin.findOne({ email: userEmail });
            if (admin) {
                if (admin.role === 'superadmin') {
                    return res.status(400).json({ error: 'Superadmin account cannot be deleted via app self-service' });
                }
                await Admin.findOneAndDelete({ email: userEmail });
                console.log(`[DeleteAccount] Deleted Admin by email: ${userEmail}`);
                deleted = true;
            }
        }

        if (!deleted) {
            console.warn(`[DeleteAccount] Account not found — userId: ${userId}, email: ${userEmail}`);
            return res.status(404).json({ error: 'Account not found or already deleted' });
        }

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        console.error('[DeleteAccount] Server error:', err);
        res.status(500).json({ error: 'Server error while deleting account' });
    }
};

router.delete('/delete-account', verifyToken, handleDeleteAccount);
router.post('/delete-account', verifyToken, handleDeleteAccount);

module.exports = router;


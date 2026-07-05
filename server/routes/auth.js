const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/Admin');

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
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Signup (superadmin only) ─────────────────────────────────────────────────
router.post('/signup', verifySuperAdmin, async (req, res) => {
    const { email, password, first_name, last_name, phone, organization } = req.body;
    if (!email || !password || !first_name || !last_name)
        return res.status(400).json({ error: 'Email, password, first name, and last name are required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
        return res.status(400).json({ error: 'Invalid email format' });

    try {
        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'Email already exists' });

        const hashed = await bcrypt.hash(password, 10);
        await Admin.create({
            email: email.toLowerCase(),
            password: hashed,
            first_name, last_name, phone, organization,
        });
        res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) return res.json({ message: 'If that email exists, a reset link has been sent.' });

        const token   = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000);

        admin.reset_token   = token;
        admin.reset_expires = expires;
        await admin.save({ validateBeforeSave: false });

        const { sendPasswordResetEmail } = require('../services/emailService');
        await sendPasswordResetEmail(email, 'Admin Portal', token);

        res.json({
            message:    'If that email exists, a reset link has been sent.',
            mockToken:  process.env.NODE_ENV === 'development' ? token : undefined,
        });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to send reset email' });
    }
});

// ─── Reset password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const admin = await Admin.findOne({
            reset_token:   token,
            reset_expires: { $gt: new Date() },
        });
        if (!admin) return res.status(400).json({ error: 'Invalid or expired token' });

        admin.password      = await bcrypt.hash(newPassword, 10);
        admin.reset_token   = undefined;
        admin.reset_expires = undefined;
        await admin.save({ validateBeforeSave: false });

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

// ─── Invite portal user (creates account with temp password) ─────────────────
router.post('/invite', verifyToken, async (req, res) => {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    try {
        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'An account with this email already exists' });
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashed = await bcrypt.hash(tempPassword, 10);
        const newAdmin = await Admin.create({
            email: email.toLowerCase(),
            password: hashed,
            first_name: email.split('@')[0],
            last_name: '',
            role: role || 'admin',
        });
        // Send invite email
        try {
            const { sendPasswordResetEmail } = require('../services/emailService');
            await sendPasswordResetEmail(email, 'Portal Invitation', tempPassword);
        } catch (emailErr) {
            console.warn('Could not send invite email:', emailErr.message);
        }
        res.status(201).json({
            message: 'Invite sent',
            user: { id: newAdmin._id, email: newAdmin.email, role: newAdmin.role, status: 'invited' }
        });
    } catch (err) {
        console.error('Invite error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── List admins ───────────────────────────────────────────────────────────────
router.get('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password -reset_token -reset_expires');
        res.json(admins);
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

module.exports = router;

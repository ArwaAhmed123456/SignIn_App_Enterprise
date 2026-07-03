const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Middleware to check if user is Super Admin
const verifySuperAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.findById(decoded.id);
        if (!admin || admin.role !== 'superadmin') {
            return res.status(403).json({ error: 'Access denied. Super Admin only.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        console.time(`Login-${email}`);
        const admin = await Admin.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
        if (!admin) {
            console.timeEnd(`Login-${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            console.timeEnd(`Login-${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
        console.timeEnd(`Login-${email}`);
        res.json({ token, user: { email: admin.email, role: admin.role } });
    } catch (err) {
        console.timeEnd(`Login-${email}`);
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/signup', verifySuperAdmin, async (req, res) => {
    const { email, password, first_name, last_name, phone, organization } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const existing = await Admin.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const admin = new Admin({
            email,
            password,
            first_name,
            last_name,
            phone,
            organization
        });

        await admin.save();
        res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        admin.reset_token = token;
        admin.reset_expires = expires;
        await admin.save();

        const { sendPasswordResetEmail } = require('../services/emailService');
        await sendPasswordResetEmail(email, token);

        res.json({
            message: 'If that email exists, a reset link has been sent.',
            mockToken: process.env.NODE_ENV === 'development' ? token : undefined
        });
    } catch (error) {
        console.error('Password reset email error:', error);
        return res.status(500).json({ error: 'Failed to send reset email' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const admin = await Admin.findOne({
            reset_token: token,
            reset_expires: { $gt: Date.now() }
        });

        if (!admin) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        admin.password = newPassword;
        admin.reset_token = undefined;
        admin.reset_expires = undefined;
        await admin.save();

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Super Admin only routes
router.get('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const admins = await Admin.find({}, '-password');
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id);
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (admin.role === 'superadmin') {
            return res.status(400).json({ error: 'Cannot delete superadmin' });
        }

        await Admin.findByIdAndDelete(req.params.id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

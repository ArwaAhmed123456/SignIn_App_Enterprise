const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

// Middleware to check if user is Super Admin
const verifySuperAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
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
        const admin = await prisma.admin.findUnique({
            where: { email: email.toLowerCase() }
        });
        
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role, firstName: admin.firstName || '', lastName: admin.lastName || '' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                email:        admin.email,
                role:         admin.role,
                firstName:    admin.firstName    || '',
                lastName:     admin.lastName     || '',
                organization: admin.organization || '',
            }
        });
    } catch (err) {
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
        const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.admin.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                firstName: first_name,
                lastName: last_name,
                phone,
                organization
            }
        });
        
        res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
        if (!admin) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                resetToken: token,
                resetExpires: expires
            }
        });

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
        const admin = await prisma.admin.findFirst({
            where: {
                resetToken: token,
                resetExpires: { gt: new Date() }
            }
        });

        if (!admin) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.admin.update({
            where: { id: admin.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetExpires: null
            }
        });

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Super Admin only routes
router.get('/admins', verifySuperAdmin, async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                organization: true,
                role: true,
                createdAt: true
            }
        });
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/admins/:id', verifySuperAdmin, async (req, res) => {
    try {
        const admin = await prisma.admin.findUnique({ where: { id: req.params.id } });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        if (admin.role === 'superadmin') {
            return res.status(400).json({ error: 'Cannot delete superadmin' });
        }

        await prisma.admin.delete({ where: { id: req.params.id } });
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Authenticated admin changes their own password
router.post('/change-password', async (req, res) => {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'No token' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });

        const valid = await bcrypt.compare(currentPassword, admin.password);
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.admin.update({ where: { id: decoded.id }, data: { password: hashed } });
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

module.exports = router;

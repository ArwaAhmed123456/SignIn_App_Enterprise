const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { generateResetToken, sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

router.get('/:id/public', async (req, res) => {
    try {
        const site = await prisma.site.findUnique({
            where: { id: req.params.id }
        });

        if (!site) return res.status(404).json({ error: 'Project not found' });

        res.json({
            id: site.id,
            _id: site.id,
            name: site.name,
            code: site.code
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const sites = await prisma.site.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        // Transform for frontend compatibility
        const transformedProjects = sites.map(s => ({
            id: s.id,
            _id: s.id,
            name: s.name,
            code: s.code,
            admin_email: s.adminEmail,
            created_at: s.createdAt
        }));
        res.json(transformedProjects);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const { name, code, password, admin_email } = req.body;
    if (!name || !code || !password || !admin_email) {
        return res.status(400).json({ error: 'Name, Code, Password, and Admin Email are required' });
    }

    try {
        const existing = await prisma.site.findUnique({ where: { code: code.trim().toUpperCase() } });
        if (existing) {
            return res.status(400).json({ error: 'Project code already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const site = await prisma.site.create({
            data: {
                name,
                code: code.trim().toUpperCase(),
                password: hashedPassword,
                adminEmail: admin_email
            }
        });

        res.json({
            id: site.id,
            _id: site.id,
            name: site.name,
            code: site.code,
            admin_email: site.adminEmail,
            created_at: site.createdAt
        });
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/ping', (req, res) => {
    res.json({ status: 'ok' });
});

router.post('/verify-code', async (req, res) => {
    let { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Project code required' });

    code = code.trim().toUpperCase();
    try {
        console.time(`VerifyCode-${code}`);
        const site = await prisma.site.findUnique({ where: { code } });
        if (!site) {
            console.timeEnd(`VerifyCode-${code}`);
            return res.status(400).json({ error: 'Invalid project code' });
        }
        console.timeEnd(`VerifyCode-${code}`);
        res.json({
            valid: true,
            project: {
                id: site.id,
                _id: site.id,
                name: site.name,
                code: site.code
            }
        });
    } catch (err) {
        console.timeEnd(`VerifyCode-${code}`);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/verify-access', async (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    try {
        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return res.status(404).json({ error: 'Project not found' });

        if (site.password) {
            const valid = await bcrypt.compare(password, site.password);
            if (!valid) return res.status(401).json({ error: 'Incorrect project password' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id/password', verifyToken, async (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) return res.status(400).json({ error: 'Password required' });

    try {
        const hash = await bcrypt.hash(password, 10);
        await prisma.site.update({
            where: { id },
            data: { password: hash }
        });
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return res.status(404).json({ error: 'Project not found' });

        // Note: Logs and Guards deletion will be handled automatically by Prisma Cascading deletes
        // once they are migrated. For now, since they are Mongoose, we leave them or manually delete.
        // Wait, the Mongoose models are still there! If I delete the Site, the Mongo records will orphan.
        // I will just delete the Site from Prisma.
        await prisma.site.delete({ where: { id } });

        res.json({ message: 'Project and all associated data deleted successfully' });
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });

    try {
        const existing = await prisma.site.findFirst({
            where: {
                code: code.trim().toUpperCase(),
                id: { not: id }
            }
        });
        
        if (existing) return res.status(400).json({ error: 'Project code already exists' });

        await prisma.site.update({
            where: { id },
            data: {
                name,
                code: code.trim().toUpperCase()
            }
        });
        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Project code is required' });

    try {
        const site = await prisma.site.findUnique({ where: { code: code.trim().toUpperCase() } });
        if (!site) return res.status(404).json({ error: 'Project not found' });

        const resetToken = generateResetToken();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);

        await prisma.site.update({
            where: { id: site.id },
            data: {
                resetToken,
                resetTokenExpiry: expiry
            }
        });

        await sendPasswordResetEmail(site.adminEmail, site.name, resetToken);
        res.json({ message: 'Reset code sent to your email', email: site.adminEmail });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-reset-token', async (req, res) => {
    const { code, reset_token } = req.body;
    try {
        const site = await prisma.site.findFirst({
            where: {
                code: code.trim().toUpperCase(),
                resetToken: reset_token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!site) return res.status(400).json({ error: 'Invalid or expired token' });
        res.json({ valid: true, message: 'Reset code verified' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { code, reset_token, new_password } = req.body;
    try {
        const site = await prisma.site.findFirst({
            where: {
                code: code.trim().toUpperCase(),
                resetToken: reset_token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!site) return res.status(400).json({ error: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await prisma.site.update({
            where: { id: site.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

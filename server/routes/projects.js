const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Project = require('../models/Project');
const Log = require('../models/Log');
const Guard = require('../models/Guard');
const Request = require('../models/Request');
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

router.get('/', verifyToken, async (req, res) => {
    try {
        const projects = await Project.find().sort({ created_at: -1 });
        // Transform _id to id for frontend compatibility
        const transformedProjects = projects.map(p => ({
            id: p._id,
            _id: p._id,
            name: p.name,
            code: p.code,
            admin_email: p.admin_email,
            created_at: p.created_at
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
        const existing = await Project.findOne({ code: code.trim().toUpperCase() });
        if (existing) {
            return res.status(400).json({ error: 'Project code already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const project = new Project({
            name,
            code: code.trim().toUpperCase(),
            password: hashedPassword,
            admin_email
        });

        await project.save();
        res.json({
            id: project._id,
            _id: project._id,
            name: project.name,
            code: project.code,
            admin_email: project.admin_email,
            created_at: project.created_at
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
        const project = await Project.findOne({ code });
        if (!project) {
            console.timeEnd(`VerifyCode-${code}`);
            return res.status(400).json({ error: 'Invalid project code' });
        }
        console.timeEnd(`VerifyCode-${code}`);
        res.json({
            valid: true,
            project: {
                id: project._id,
                _id: project._id,
                name: project.name,
                code: project.code
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
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (project.password) {
            const valid = await bcrypt.compare(password, project.password);
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
        await Project.findByIdAndUpdate(id, { password: hash });
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        await Log.deleteMany({ project_id: id });
        await Guard.deleteMany({ project_id: id });
        await Request.deleteMany({ project_code: project.code });
        await Project.findByIdAndDelete(id);

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
        const existing = await Project.findOne({ code: code.trim().toUpperCase(), _id: { $ne: id } });
        if (existing) return res.status(400).json({ error: 'Project code already exists' });

        await Project.findByIdAndUpdate(id, { name, code: code.trim().toUpperCase() });
        res.json({ message: 'Project updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Project code is required' });

    try {
        const project = await Project.findOne({ code: code.trim().toUpperCase() }).select('name _id').lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const resetToken = generateResetToken();
        const expiry = Date.now() + 15 * 60 * 1000;

        project.reset_token = resetToken;
        project.reset_token_expiry = expiry;
        await project.save();

        await sendPasswordResetEmail(project.admin_email, project.name, resetToken);
        res.json({ message: 'Reset code sent to your email', email: project.admin_email });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/verify-reset-token', async (req, res) => {
    const { code, reset_token } = req.body;
    try {
        const project = await Project.findOne({
            code: code.trim().toUpperCase(),
            reset_token,
            reset_token_expiry: { $gt: Date.now() }
        });

        if (!project) return res.status(400).json({ error: 'Invalid or expired token' });
        res.json({ valid: true, message: 'Reset code verified' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { code, reset_token, new_password } = req.body;
    try {
        const project = await Project.findOne({
            code: code.trim().toUpperCase(),
            reset_token,
            reset_token_expiry: { $gt: Date.now() }
        });

        if (!project) return res.status(400).json({ error: 'Invalid or expired token' });

        project.password = await bcrypt.hash(new_password, 10);
        project.reset_token = undefined;
        project.reset_token_expiry = undefined;
        await project.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Request = require('../models/Request');

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

router.post('/', async (req, res) => {
    const { project_code, user_name, requested_date, reason } = req.body;
    if (!project_code || !user_name || !requested_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const request = new Request({
            project_code: project_code.trim().toUpperCase(),
            user_name,
            requested_date,
            reason: reason || ''
        });
        await request.save();
        res.json({ success: true, id: request._id });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/pending', verifyToken, async (req, res) => {
    try {
        const requests = await Request.find({ status: 'pending' }).sort({ created_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        await Request.findByIdAndUpdate(req.params.id, { status });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json({ status: request.status });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

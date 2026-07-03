const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Log = require('../models/Log');
const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

const eventBus = require('../services/eventBus');
const manifestCache = require('../services/manifestCache');
const VisitorGroup = require('../models/VisitorGroup');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Read project code from the body (which form-data sets)
        const projectCode = req.body.project_code ? req.body.project_code.trim().toUpperCase() : 'UNKNOWN';
        const uploadDir = `uploads/${projectCode}/`;
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

router.get('/', async (req, res) => {
    const { project_code } = req.query;
    if (!project_code) return res.status(400).json({ error: 'Missing project_code' });

    try {
        const project = await Project.findOne({ code: project_code.trim().toUpperCase() }).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const logs = await Log.find({ project_id: project._id }).sort({ date: -1, time_in: 1 }).lean();

        // Map to include 'id' field for mobile app compatibility
        const logsWithId = logs.map(log => ({
            ...log,
            id: log._id
        }));

        res.json(logsWithId);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

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

router.post('/', upload.single('image'), async (req, res) => {
    const { project_code, name, trade, car_reg, user_type, time_in, time_out, date, reason } = req.body;

    if (!project_code || !name || !time_in || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const project = await Project.findOne({ code: project_code.trim().toUpperCase() }).select('_id').lean();
        if (!project) return res.status(400).json({ error: 'Invalid project code' });

        let hours = null;
        if (time_out) {
            const start = new Date(`${date}T${time_in}`);
            const end = new Date(`${date}T${time_out}`);
            let diffMs = end - start;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
            if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000; // Treat same time as 24-hour shift
            hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;
        }

        const logData = {
            project_id: project._id,
            name,
            trade: trade || '',
            car_reg: car_reg || '',
            user_type: user_type || 'Employee',
            time_in,
            time_out: time_out || null,
            hours,
            date,
            reason: reason || ''
        };

        if (req.file) {
            const projectCode = project_code.trim().toUpperCase();
            logData.image_url = `/uploads/${projectCode}/${req.file.filename}`;
        }

        const log = new Log(logData);
        await log.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('newAttendance', { name, project_code, date, time_in });
        }

        // Phase 2: Add to manifest cache
        manifestCache.addWorker(project_code, log);

        // Phase 3: Emit check-in event for notifications
        let group = null;
        if (req.body.visitor_group) {
            group = await VisitorGroup.findOne({ project_id: project._id, name: req.body.visitor_group }).lean();
        }
        eventBus.emit('checkin', { log, project, group });

        res.json({ success: true, message: 'Check-in successful', id: log._id });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/manual', verifyToken, async (req, res) => {
    const { project_id, name, trade, car_reg, user_type, time_in, time_out, date } = req.body;

    if (!project_id || !name || !time_in || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let hours = 0;
    if (time_out) {
        const start = new Date(`${date}T${time_in}`);
        const end = new Date(`${date}T${time_out}`);
        let diffMs = end - start;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000; // Treat same time as 24-hour shift
        hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;
    }

    try {
        const log = new Log({
            project_id,
            name,
            trade: trade || '',
            car_reg: car_reg || '',
            user_type: user_type || 'Employee',
            time_in,
            time_out,
            hours,
            date
        });
        await log.save();
        res.json({ success: true, message: 'Log created manually' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/active/:projectCode', async (req, res) => {
    const { projectCode } = req.params;
    try {
        const project = await Project.findOne({ code: projectCode.trim().toUpperCase() });
        if (!project) return res.status(400).json({ error: 'Invalid project' });

        const logs = await Log.find({ project_id: project._id, time_out: null })
            .sort({ date: -1, time_in: 1 })
            .lean();

        // Map to include 'id' field for mobile app compatibility
        const logsWithId = logs.map(log => ({
            ...log,
            id: log._id
        }));

        res.json(logsWithId);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/recent/:projectCode', async (req, res) => {
    const { projectCode } = req.params;
    const today = new Date().toISOString().split('T')[0];
    try {
        const project = await Project.findOne({ code: projectCode.trim().toUpperCase() });
        if (!project) return res.status(400).json({ error: 'Invalid project' });

        // Get logs that have time_out and are from today
        const logs = await Log.find({
            project_id: project._id,
            time_out: { $ne: null },
            date: today
        }).sort({ created_at: -1 }).limit(20).lean();

        const logsWithId = logs.map(log => ({
            ...log,
            id: log._id
        }));

        res.json(logsWithId);
    } catch (err) {
        console.error('Error fetching recent logs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/checkout', async (req, res) => {
    const logId = req.params.id;
    let { timeOut } = req.body;

    if (!timeOut) {
        const now = new Date();
        timeOut = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    }

    try {
        const log = await Log.findById(logId);
        if (!log) return res.status(404).json({ error: 'Log not found' });

        const start = new Date(`${log.date}T${log.time_in}`);
        const end = new Date(`${log.date}T${timeOut}`);
        let diffMs = end - start;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000; // Treat same time as 24-hour shift
        let hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;

        log.time_out = timeOut;
        log.hours = hours;
        await log.save();

        // Phase 2: Remove from manifest cache
        const project = await Project.findById(log.project_id).lean();
        if (project) {
            manifestCache.removeWorker(project.code, log._id);
            eventBus.emit('checkout', { log, project });
        }

        res.json({ success: true, message: 'Checkout successful', time_out: timeOut, hours });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/project/:id', verifyToken, async (req, res) => {
    try {
        const logs = await Log.find({ project_id: req.params.id }).sort({ date: -1, time_in: 1 }).lean();
        const project = await Project.findById(req.params.id).lean();

        // Transform logs to include 'id' field for frontend compatibility
        const logsWithId = logs.map(log => ({
            ...log,
            id: log._id
        }));

        res.json({ project, logs: logsWithId });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    const { name, trade, car_reg, user_type, time_in, time_out, reason, date } = req.body;
    try {
        const start = new Date(`${date}T${time_in}`);
        const end = new Date(`${date}T${time_out}`);
        let diffMs = end - start;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle overnight shifts
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000; // Treat same time as 24-hour shift
        let hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;

        await Log.findByIdAndUpdate(req.params.id, {
            name, trade, car_reg, user_type, time_in, time_out, hours, reason, date
        });
        res.json({ success: true, message: 'Log updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Log.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/undo-checkout', async (req, res) => {
    try {
        const log = await Log.findByIdAndUpdate(req.params.id, { time_out: null, hours: null }, { new: true });
        
        // Phase 2: Restore to manifest cache
        if (log) {
            const project = await Project.findById(log.project_id).lean();
            if (project) manifestCache.restoreWorker(project.code, log._id);
        }

        res.json({ success: true, message: 'Checkout undone successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

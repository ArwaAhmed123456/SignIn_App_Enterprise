const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const eventBus = require('../services/eventBus');
const manifestCache = require('../services/manifestCache');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
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

const formatLog = (log) => ({
    ...log,
    _id: log.id,
    project_id: log.siteId,
    time_in: log.timeIn,
    time_out: log.timeOut,
    user_type: log.userType,
    car_reg: log.carReg,
    image_url: log.imageUrl,
    created_at: log.createdAt
});

router.get('/', async (req, res) => {
    const { project_code } = req.query;
    if (!project_code) return res.status(400).json({ error: 'Missing project_code' });

    try {
        const site = await prisma.site.findUnique({ where: { code: project_code.trim().toUpperCase() } });
        if (!site) return res.status(404).json({ error: 'Project not found' });

        const logs = await prisma.activityLog.findMany({
            where: { siteId: site.id },
            orderBy: [
                { date: 'desc' },
                { timeIn: 'asc' }
            ]
        });

        res.json(logs.map(formatLog));
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', upload.single('image'), async (req, res) => {
    const { project_code, name, trade, car_reg, user_type, time_in, time_out, date, reason } = req.body;

    if (!project_code || !name || !time_in || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const site = await prisma.site.findUnique({ where: { code: project_code.trim().toUpperCase() } });
        if (!site) return res.status(400).json({ error: 'Invalid project code' });

        let hours = null;
        if (time_out) {
            const start = new Date(`${date}T${time_in}`);
            const end = new Date(`${date}T${time_out}`);
            let diffMs = end - start;
            if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
            if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000;
            hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;
        }

        const logData = {
            siteId: site.id,
            name,
            trade: trade || '',
            carReg: car_reg || '',
            userType: user_type || 'Employee',
            timeIn: time_in,
            timeOut: time_out || null,
            hours,
            date,
            reason: reason || ''
        };

        if (req.file) {
            const projectCode = project_code.trim().toUpperCase();
            logData.imageUrl = `/uploads/${projectCode}/${req.file.filename}`;
        }

        const log = await prisma.activityLog.create({ data: logData });

        const io = req.app.get('io');
        if (io) {
            io.emit('newAttendance', { name, project_code, date, time_in });
        }

        manifestCache.addWorker(project_code, log);

        let group = null;
        if (req.body.visitor_group) {
            group = await prisma.visitorGroup.findFirst({
                where: { siteId: site.id, name: req.body.visitor_group }
            });
        }
        eventBus.emit('checkin', { log: formatLog(log), project: site, group });

        res.json({ success: true, message: 'Check-in successful', id: log.id });
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
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000;
        hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;
    }

    try {
        await prisma.activityLog.create({
            data: {
                siteId: project_id,
                name,
                trade: trade || '',
                carReg: car_reg || '',
                userType: user_type || 'Employee',
                timeIn: time_in,
                timeOut: time_out,
                hours,
                date
            }
        });
        res.json({ success: true, message: 'Log created manually' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/active/:projectCode', async (req, res) => {
    const { projectCode } = req.params;
    try {
        const site = await prisma.site.findUnique({ where: { code: projectCode.trim().toUpperCase() } });
        if (!site) return res.status(400).json({ error: 'Invalid project' });

        const logs = await prisma.activityLog.findMany({
            where: { siteId: site.id, timeOut: null },
            orderBy: [
                { date: 'desc' },
                { timeIn: 'asc' }
            ]
        });

        res.json(logs.map(formatLog));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/recent/:projectCode', async (req, res) => {
    const { projectCode } = req.params;
    const today = new Date().toISOString().split('T')[0];
    try {
        const site = await prisma.site.findUnique({ where: { code: projectCode.trim().toUpperCase() } });
        if (!site) return res.status(400).json({ error: 'Invalid project' });

        const logs = await prisma.activityLog.findMany({
            where: {
                siteId: site.id,
                timeOut: { not: null },
                date: today
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(logs.map(formatLog));
    } catch (err) {
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
        const log = await prisma.activityLog.findUnique({ where: { id: logId } });
        if (!log) return res.status(404).json({ error: 'Log not found' });

        const start = new Date(`${log.date}T${log.timeIn}`);
        const end = new Date(`${log.date}T${timeOut}`);
        let diffMs = end - start;
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000;
        let hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;

        const updatedLog = await prisma.activityLog.update({
            where: { id: logId },
            data: { timeOut, hours }
        });

        const site = await prisma.site.findUnique({ where: { id: log.siteId } });
        if (site) {
            manifestCache.removeWorker(site.code, log.id);
            eventBus.emit('checkout', { log: formatLog(updatedLog), project: site });
        }

        res.json({ success: true, message: 'Checkout successful', time_out: timeOut, hours });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/project/:id', verifyToken, async (req, res) => {
    try {
        const site = await prisma.site.findUnique({ where: { id: req.params.id } });
        if (!site) return res.status(404).json({ error: 'Project not found' });

        const logs = await prisma.activityLog.findMany({
            where: { siteId: site.id },
            orderBy: [
                { date: 'desc' },
                { timeIn: 'asc' }
            ]
        });

        res.json({ project: { ...site, _id: site.id }, logs: logs.map(formatLog) });
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
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        if (diffMs === 0) diffMs = 24 * 60 * 60 * 1000;
        let hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)) || 0;

        await prisma.activityLog.update({
            where: { id: req.params.id },
            data: {
                name,
                trade,
                carReg: car_reg,
                userType: user_type,
                timeIn: time_in,
                timeOut: time_out,
                hours,
                reason,
                date
            }
        });
        res.json({ success: true, message: 'Log updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await prisma.activityLog.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Log deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/undo-checkout', async (req, res) => {
    try {
        const log = await prisma.activityLog.update({
            where: { id: req.params.id },
            data: { timeOut: null, hours: null }
        });
        
        const site = await prisma.site.findUnique({ where: { id: log.siteId } });
        if (site) manifestCache.restoreWorker(site.code, log.id);

        res.json({ success: true, message: 'Checkout undone successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

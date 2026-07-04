/**
 * manifestCache.js — Phase 2: High-Availability Evacuation Manifest
 * Refactored to use Prisma ORM instead of Mongoose.
 */

const prisma = require('../prismaClient');

const cache = new Map();

function _getOrCreate(projectCode) {
    if (!cache.has(projectCode)) {
        cache.set(projectCode, { workers: [], lastUpdated: null, seeded: false });
    }
    return cache.get(projectCode);
}

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

async function seedFromDB(projectCode) {
    try {
        const site = await prisma.site.findUnique({ where: { code: projectCode.trim().toUpperCase() } });
        if (!site) return null;

        const today = new Date().toISOString().split('T')[0];
        const workers = await prisma.activityLog.findMany({
            where: {
                siteId: site.id,
                timeOut: null,
                date: today
            }
        });

        const entry = _getOrCreate(projectCode);
        entry.workers     = workers.map(formatLog);
        entry.lastUpdated = new Date();
        entry.seeded      = true;

        console.log(`[ManifestCache] Seeded ${projectCode}: ${workers.length} active workers`);
        return entry;
    } catch (err) {
        console.error(`[ManifestCache] Seed error for ${projectCode}:`, err);
        return null;
    }
}

async function getManifest(projectCode) {
    const code = projectCode.trim().toUpperCase();
    const entry = cache.get(code);

    if (!entry || !entry.seeded) {
        const fresh = await seedFromDB(code);
        return fresh;
    }
    return entry;
}

function addWorker(projectCode, logObject) {
    const code  = projectCode.trim().toUpperCase();
    const entry = _getOrCreate(code);
    const worker = logObject.id ? formatLog(logObject) : logObject; // format if it's a prisma obj

    const alreadyPresent = entry.workers.some(w => w.id === worker.id);
    if (!alreadyPresent) {
        entry.workers.push(worker);
    }
    entry.lastUpdated = new Date();
}

function removeWorker(projectCode, logId) {
    const code  = projectCode.trim().toUpperCase();
    const entry = cache.get(code);
    if (!entry) return;

    entry.workers = entry.workers.filter(w =>
        w.id !== logId && w._id !== logId
    );
    entry.lastUpdated = new Date();
}

async function restoreWorker(projectCode, logId) {
    const code  = projectCode.trim().toUpperCase();
    const entry = _getOrCreate(code);
    const log   = await prisma.activityLog.findUnique({ where: { id: logId } });
    if (!log) return;

    const alreadyPresent = entry.workers.some(w => w.id === logId);
    if (!alreadyPresent) {
        entry.workers.push(formatLog(log));
        entry.lastUpdated = new Date();
    }
}

function invalidate(projectCode) {
    cache.delete(projectCode.trim().toUpperCase());
}

function stats() {
    const result = {};
    for (const [code, entry] of cache.entries()) {
        result[code] = {
            worker_count: entry.workers.length,
            last_updated: entry.lastUpdated,
            seeded: entry.seeded
        };
    }
    return result;
}

module.exports = { seedFromDB, getManifest, addWorker, removeWorker, restoreWorker, invalidate, stats };

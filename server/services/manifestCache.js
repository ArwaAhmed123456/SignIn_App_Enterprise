/**
 * manifestCache.js — Phase 2: High-Availability Evacuation Manifest
 *
 * In-process Map cache that holds the live set of checked-in workers per site.
 * Design principles:
 *   - Zero latency reads (from memory, not DB)
 *   - Automatically seeded from DB on first request (cache-aside pattern)
 *   - Updated atomically on every check-in and checkout
 *   - Falls back to DB query on any cache corruption or miss
 *   - Thread-safe for single-process Node.js (event loop guarantees)
 *
 * Upgrade path: replace Map with ioredis client for multi-instance deployments.
 */

const Log     = require('../models/Log');
const Project = require('../models/Project');

// Map<projectCode: string, ManifestEntry>
// ManifestEntry: { workers: LogObject[], lastUpdated: Date, seeded: boolean }
const cache = new Map();

// ── Internal helpers ────────────────────────────────────────────────

function _getOrCreate(projectCode) {
    if (!cache.has(projectCode)) {
        cache.set(projectCode, { workers: [], lastUpdated: null, seeded: false });
    }
    return cache.get(projectCode);
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Seed the cache for a project by querying MongoDB for all active workers.
 * Called on server start and on first manifest request for a project.
 */
async function seedFromDB(projectCode) {
    try {
        const project = await Project.findOne({ code: projectCode.trim().toUpperCase() }).lean();
        if (!project) return null;

        const today = new Date().toISOString().split('T')[0];
        const workers = await Log.find({
            project_id: project._id,
            time_out: null,
            date: today
        }).lean();

        const entry = _getOrCreate(projectCode);
        entry.workers     = workers.map(w => ({ ...w, id: w._id }));
        entry.lastUpdated = new Date();
        entry.seeded      = true;

        console.log(`[ManifestCache] Seeded ${projectCode}: ${workers.length} active workers`);
        return entry;
    } catch (err) {
        console.error(`[ManifestCache] Seed error for ${projectCode}:`, err);
        return null;
    }
}

/**
 * Get the live manifest for a project.
 * If the cache is not yet seeded, seeds it from DB first.
 */
async function getManifest(projectCode) {
    const code = projectCode.trim().toUpperCase();
    const entry = cache.get(code);

    if (!entry || !entry.seeded) {
        const fresh = await seedFromDB(code);
        return fresh;
    }
    return entry;
}

/**
 * Add a worker to the in-memory manifest after a successful check-in.
 * Called from the logs POST route immediately after log.save().
 */
function addWorker(projectCode, logDocument) {
    const code  = projectCode.trim().toUpperCase();
    const entry = _getOrCreate(code);
    const worker = { ...logDocument.toObject?.() ?? logDocument, id: logDocument._id ?? logDocument.id };

    // Prevent duplicates (idempotent)
    const alreadyPresent = entry.workers.some(w => w._id?.toString() === worker._id?.toString());
    if (!alreadyPresent) {
        entry.workers.push(worker);
    }
    entry.lastUpdated = new Date();
}

/**
 * Remove a worker from the in-memory manifest after checkout.
 * Called from the logs POST /:id/checkout route.
 */
function removeWorker(projectCode, logId) {
    const code  = projectCode.trim().toUpperCase();
    const entry = cache.get(code);
    if (!entry) return;

    entry.workers = entry.workers.filter(w =>
        w._id?.toString() !== logId.toString() &&
        w.id?.toString()  !== logId.toString()
    );
    entry.lastUpdated = new Date();
}

/**
 * Restore a worker to the manifest after undo-checkout.
 */
async function restoreWorker(projectCode, logId) {
    const code  = projectCode.trim().toUpperCase();
    const entry = _getOrCreate(code);
    const log   = await Log.findById(logId).lean();
    if (!log) return;

    const alreadyPresent = entry.workers.some(w => w._id?.toString() === logId.toString());
    if (!alreadyPresent) {
        entry.workers.push({ ...log, id: log._id });
        entry.lastUpdated = new Date();
    }
}

/**
 * Invalidate (clear) the cache for a project — forces re-seed on next request.
 */
function invalidate(projectCode) {
    cache.delete(projectCode.trim().toUpperCase());
}

/**
 * Return raw stats for health monitoring.
 */
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

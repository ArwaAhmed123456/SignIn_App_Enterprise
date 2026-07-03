const express = require('express');
const router = express.Router();
const manifestCache = require('../services/manifestCache');

// ── GET /api/manifest/:projectCode ───────────────────────────────────
// Lightweight, unauthenticated route for emergency wardens.
// Returns the live active manifest from the in-memory cache instantly.
// Uses ETags/If-None-Match to save bandwidth on polling.
router.get('/:projectCode', async (req, res) => {
    const { projectCode } = req.params;
    if (!projectCode) return res.status(400).json({ error: 'Project code required' });

    try {
        const manifest = await manifestCache.getManifest(projectCode);
        if (!manifest) {
            return res.status(404).json({ error: 'Project not found or manifest could not be seeded' });
        }

        // Generate ETag based on lastUpdated timestamp
        const etag = `W/"${manifest.lastUpdated ? manifest.lastUpdated.getTime() : 'empty'}"`;

        // Check if client's cached version is still valid
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end(); // Not Modified (client uses their cache)
        }

        res.setHeader('ETag', etag);
        res.json({
            success: true,
            project_code: projectCode.toUpperCase(),
            count: manifest.workers.length,
            generated_at: manifest.lastUpdated || new Date(),
            cache_source: 'memory',
            workers: manifest.workers
        });
    } catch (err) {
        console.error('[Manifest Route Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ── GET /api/manifest/health/stats ───────────────────────────────────
// Internal health endpoint to monitor cache size
router.get('/health/stats', (req, res) => {
    res.json(manifestCache.stats());
});

module.exports = router;

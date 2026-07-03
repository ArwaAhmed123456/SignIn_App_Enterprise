const express = require('express');
const router = express.Router();
const Guard = require('../models/Guard');
const Project = require('../models/Project');

// Levenshtein distance for fuzzy matching
function getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

// Convert Levenshtein distance to a 0-100 score
function calculateMatchScore(text, searchStr) {
    const textLower = text.toLowerCase();
    const searchLower = searchStr.toLowerCase();
    
    // Exact match
    if (textLower.includes(searchLower)) return 100;

    // Fuzzy match
    const words = textLower.split(/\s+/);
    const searchWords = searchLower.split(/\s+/);
    
    let totalScore = 0;
    for (const searchWord of searchWords) {
        let bestWordScore = 0;
        for (const word of words) {
            const distance = getLevenshteinDistance(word, searchWord);
            const maxLength = Math.max(word.length, searchWord.length);
            const wordScore = maxLength === 0 ? 100 : Math.max(0, 100 - (distance / maxLength * 100));
            if (wordScore > bestWordScore) {
                bestWordScore = wordScore;
            }
        }
        totalScore += bestWordScore;
    }
    
    return totalScore / searchWords.length;
}

// ── POST /api/deliveries/ocr-match ──────────────────────────────────
router.post('/ocr-match', async (req, res) => {
    const { raw_text, project_code } = req.body;
    if (!raw_text || !project_code) {
        return res.status(400).json({ error: 'raw_text and project_code required' });
    }

    try {
        const project = await Project.findOne({ code: project_code.trim().toUpperCase() }).select('_id').lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Get all personnel for this site
        const guards = await Guard.find({ project_id: project._id }).select('name email role').lean();

        // Run fuzzy match against all names
        const matches = guards.map(guard => {
            const score = calculateMatchScore(raw_text, guard.name);
            return {
                id: guard._id,
                name: guard.name,
                email: guard.email,
                role: guard.role,
                score: Math.round(score)
            };
        }).filter(m => m.score > 40); // Filter out garbage matches

        // Sort by highest score first, return top 3
        matches.sort((a, b) => b.score - a.score);
        
        res.json({
            success: true,
            matches: matches.slice(0, 3)
        });
    } catch (err) {
        console.error('[OCR Match Error]', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

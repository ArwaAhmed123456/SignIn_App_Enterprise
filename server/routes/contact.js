const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/emailService');

// @route   POST /api/contact
// @desc    Send a contact email/query to admin
// @access  Public
router.post('/', async (req, res) => {
    const { email, query } = req.body;

    if (!email || !query) {
        return res.status(400).json({ error: 'Email and query are required' });
    }

    try {
        const result = await sendContactEmail(email, query);

        if (result.success) {
            return res.status(200).json({ message: 'Query sent successfully' });
        } else {
            return res.status(500).json({ error: 'Failed to send email' });
        }
    } catch (error) {
        console.error('Contact route error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

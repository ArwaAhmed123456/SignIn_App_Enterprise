const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    project_code: { type: String, required: true, uppercase: true, trim: true },
    user_name: { type: String, required: true },
    requested_date: { type: String, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);

const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    project_code: { type: String, required: true },
    user_name: { type: String, required: true },
    requested_date: { type: String, required: true },
    reason: String,
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DateRequest', requestSchema);

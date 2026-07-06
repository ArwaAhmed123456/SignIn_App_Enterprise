const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    first_name: String,
    last_name: String,
    phone: String,
    organization: String,
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    reset_token: String,
    reset_expires: Date,
    created_at: { type: Date, default: Date.now }
});

// NOTE: No pre-save password hashing here.
// auth.js already calls bcrypt.hash() before saving, so hashing here would double-hash.

module.exports = mongoose.model('Admin', adminSchema);

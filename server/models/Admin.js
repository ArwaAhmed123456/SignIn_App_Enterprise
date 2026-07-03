const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

adminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Admin', adminSchema);

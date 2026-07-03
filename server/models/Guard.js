const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const guardSchema = new mongoose.Schema({
    // ── Core identity ──────────────────────────────────────────────
    name:  { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },                          // for SMS notifications (Module 4)
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

    // ── Role & granular permissions ─────────────────────────────────
    role: {
        type: String,
        enum: ['guard', 'manager', 'admin'],
        default: 'guard'
    },
    permissions: {
        can_mobile_sign_in:  { type: Boolean, default: false }, // companion app access
        can_export_reports:  { type: Boolean, default: false },
        can_manage_workers:  { type: Boolean, default: false },
        can_view_manifest:   { type: Boolean, default: true },  // evacuation list
        custom_config:       { type: Boolean, default: false }  // overrides group defaults
    },

    // ── Mobile companion onboarding (Module 2) ──────────────────────
    // Token is stored as a bcrypt hash; plain text is sent by email only once.
    mobile_token_hash:   { type: String },
    mobile_token_expiry: { type: Date },              // strict 72h TTL
    mobile_paired:       { type: Boolean, default: false },
    mobile_device_id:    { type: String },            // Expo device ID of paired phone
    mobile_paired_at:    { type: Date },

    // ── Metadata ────────────────────────────────────────────────────
    created_at: { type: Date, default: Date.now }
});

// ── Pre-save: hash password if modified ─────────────────────────────
guardSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// ── Instance method: generate a secure 12-digit numeric token ───────
guardSchema.methods.generateMobileToken = async function () {
    // 12 cryptographically random digits
    const rawToken = Array.from(crypto.randomBytes(6))
        .map(b => b % 10)
        .join('');

    this.mobile_token_hash = await bcrypt.hash(rawToken, 10);
    this.mobile_token_expiry = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h
    this.mobile_paired = false;
    this.mobile_device_id = null;

    return rawToken; // returned ONCE — caller emails it, never stored plain-text
};

// ── Instance method: verify a candidate token ────────────────────────
guardSchema.methods.verifyMobileToken = async function (candidateToken) {
    if (!this.mobile_token_hash || !this.mobile_token_expiry) return false;
    if (new Date() > this.mobile_token_expiry) return false; // expired
    return bcrypt.compare(candidateToken, this.mobile_token_hash);
};

module.exports = mongoose.model('Guard', guardSchema);

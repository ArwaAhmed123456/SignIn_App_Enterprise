const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // ── Core (existing fields) ──────────────────────────────────────
    name:  { type: String, required: true },
    code:  { type: String, required: true, unique: true, uppercase: true, trim: true },
    password:          { type: String },
    admin_email:       { type: String },
    reset_token:        String,
    reset_token_expiry: Number,
    created_at: { type: Date, default: Date.now },

    // ── Notification webhooks (Module 4) ─────────────────────────────
    webhook_slack:  { type: String },      // Slack incoming webhook URL
    webhook_teams:  { type: String },      // MS Teams incoming webhook URL
    sms_enabled:    { type: Boolean, default: false },

    // ── Badge / label printer (Module 4) ─────────────────────────────
    printer_ip:     { type: String },      // IP of networked label printer
    printer_port:   { type: Number, default: 9100 }, // standard ZPL port
    badge_format:   {                      // output format if printer not available
        type: String,
        enum: ['pdf', 'zpl', 'none'],
        default: 'none'
    },

    // ── Visitor group defaults (Module 1) ────────────────────────────
    default_visitor_group: { type: String, default: 'Employee' }
});

module.exports = mongoose.model('Project', projectSchema);

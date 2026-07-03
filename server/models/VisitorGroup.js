const mongoose = require('mongoose');

/**
 * VisitorGroup — polymorphic sign-in flow configuration per site.
 * Each project can have multiple groups (e.g. Employee, Visitor, Delivery, Contractor).
 * The fields_required / fields_optional arrays drive the mobile form dynamically.
 */
const visitorGroupSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    name: { type: String, required: true, trim: true },       // "Employee", "Visitor", "Delivery"
    icon: { type: String, default: '👤' },                    // emoji for UI
    color: { type: String, default: '#2b4594' },              // badge / pill color
    fields_required: {                                         // must be filled at sign-in
        type: [String],
        default: ['name', 'company']
    },
    fields_optional: {                                         // shown but not mandatory
        type: [String],
        default: ['car_reg', 'reason', 'photo']
    },
    // Behaviour flags
    notify_host: { type: Boolean, default: false },           // fire notification on check-in
    print_badge: { type: Boolean, default: false },           // auto-print badge on check-in
    allow_self_sign_in: { type: Boolean, default: true },     // kiosk / mobile self sign-in
    pre_registration_required: { type: Boolean, default: false }, // must be pre-registered
    // Privacy
    data_retention_days: { type: Number, default: 90 },       // auto-purge after N days
    is_active: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

visitorGroupSchema.index({ project_id: 1, is_active: 1 });

module.exports = mongoose.model('VisitorGroup', visitorGroupSchema);

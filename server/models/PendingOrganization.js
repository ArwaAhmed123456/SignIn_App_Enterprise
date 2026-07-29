const mongoose = require('mongoose');

const pendingOrganizationSchema = new mongoose.Schema({
  firstName:        { type: String, required: true },
  lastName:         { type: String, required: true },
  email:            { type: String, required: true, unique: true },
  phone:            { type: String },
  organization:     { type: String, required: true },
  passwordHash:     { type: String, required: true },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes:       { type: String },
  reviewedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  reviewedAt:       { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('PendingOrganization', pendingOrganizationSchema);

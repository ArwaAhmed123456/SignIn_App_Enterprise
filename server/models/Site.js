const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  code:               { type: String, required: true, unique: true, uppercase: true, trim: true },
  password:           { type: String },
  adminEmail:         { type: String },
  resetToken:         { type: String, default: null },
  resetTokenExpiry:   { type: Date,   default: null },

  // Notification webhooks
  webhookSlack:       { type: String },
  webhookTeams:       { type: String },
  smsEnabled:         { type: Boolean, default: false },

  // Badge / label printer
  printerIp:          { type: String },
  printerPort:        { type: Number, default: 9100 },
  badgeFormat:        { type: String, enum: ['pdf', 'zpl', 'none'], default: 'none' },

  // Visitor group defaults
  defaultVisitorGroup: { type: String, default: 'Employee' },
}, { timestamps: true });

module.exports = mongoose.model('Site', siteSchema);

const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  code:             { type: String, required: true, unique: true, uppercase: true },
  password:         { type: String },
  adminEmail:       { type: String },
  resetToken:       { type: String },
  resetTokenExpiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Site', siteSchema);

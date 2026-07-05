const mongoose = require('mongoose');

const visitorGroupSchema = new mongoose.Schema({
  siteId:                  { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  name:                    { type: String, required: true },
  type:                    { type: String, default: 'Standard' },
  icon:                    { type: String },
  color:                   { type: String },
  fieldsRequired:          { type: String, default: '["name"]' },
  fieldsOptional:          { type: String, default: '[]' },
  notifyHost:              { type: Boolean, default: false },
  printBadge:              { type: Boolean, default: false },
  allowSelfSignIn:         { type: Boolean, default: true },
  preRegistrationRequired: { type: Boolean, default: false },
  dataRetentionDays:       { type: Number, default: 90 },
  sortOrder:               { type: Number, default: 0 },
  isActive:                { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('VisitorGroup', visitorGroupSchema);

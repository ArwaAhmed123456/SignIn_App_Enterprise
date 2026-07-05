const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName:         { type: String, required: true },
  lastName:          { type: String, default: null },
  email:             { type: String, default: null },
  phone:             { type: String, default: null },
  password:          { type: String, default: null },
  role:              { type: String, default: 'Employee' },  // 'guard', 'Employee', 'mobile_employee', etc.
  status:            { type: String, default: 'Current' },   // 'Current', 'Archived'
  startDate:         { type: Date, default: null },
  endDate:           { type: Date, default: null },
  siteId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
  visitorGroupId:    { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup', default: null },
  permissions:       { type: String, default: null },  // JSON string

  // Mobile pairing
  mobilePaired:      { type: Boolean, default: false },
  mobileDeviceId:    { type: String, default: null },
  mobileTokenHash:   { type: String, default: null },
  mobileTokenExpiry: { type: Date, default: null },
  mobilePairedAt:    { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);

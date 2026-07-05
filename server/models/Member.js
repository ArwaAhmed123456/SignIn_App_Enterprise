const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName:          { type: String, required: true },
  lastName:           { type: String },
  email:              { type: String },
  password:           { type: String },
  phone:              { type: String },
  role:               { type: String, default: 'Employee' },
  status:             { type: String, enum: ['Current','Upcoming','Archived'], default: 'Current' },
  startDate:          { type: Date },
  endDate:            { type: Date },
  siteId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  visitorGroupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup' },
  permissions:        { type: String },           // JSON string
  mobilePaired:       { type: Boolean, default: false },
  mobileDeviceId:     { type: String },
  mobilePairedAt:     { type: Date },
  mobileTokenHash:    { type: String },
  mobileTokenExpiry:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);

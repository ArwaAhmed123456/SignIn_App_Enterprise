const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  siteId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  memberId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  name:      { type: String, required: true },
  trade:     { type: String, default: '' },
  carReg:    { type: String, default: '' },
  userType:  { type: String, default: 'Employee' },
  timeIn:    { type: String },   // "HH:MM" string
  timeOut:   { type: String, default: null },
  checkIn:   { type: Date },     // full Date for visits module
  checkOut:  { type: Date, default: null },
  hours:     { type: Number, default: null },
  date:      { type: String },   // "YYYY-MM-DD"
  reason:    { type: String, default: '' },
  imageUrl:  { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

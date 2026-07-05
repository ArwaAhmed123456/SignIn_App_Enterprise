const mongoose = require('mongoose');

const preRegistrationSchema = new mongoose.Schema({
  siteId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  visitorGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup' },
  memberId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  name:           { type: String, required: true },
  email:          { type: String },
  phone:          { type: String },
  notes:          { type: String },
  expectedDate:   { type: Date },
  status:         { type: String, enum: ['Pending','Arrived','Cancelled'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('PreRegistration', preRegistrationSchema);

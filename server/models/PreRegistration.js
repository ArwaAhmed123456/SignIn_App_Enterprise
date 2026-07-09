const mongoose = require('mongoose');

const preRegistrationSchema = new mongoose.Schema({
  siteId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  visitorGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup' },
  // When the mobile app uses a default group label (Visitor/Employee/Delivery/Contractor)
  // that does not exist as a VisitorGroup document, we store the label here.
  visitorGroupName: { type: String },
  memberId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  name:           { type: String, required: true },
  email:          { type: String },
  phone:          { type: String },
  notes:          { type: String },
  expectedDate:   { type: Date },
  status:         { type: String, enum: ['Pending','Arrived','Cancelled'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('PreRegistration', preRegistrationSchema);

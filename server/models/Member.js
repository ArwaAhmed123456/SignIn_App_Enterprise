const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  firstName:          { type: String, required: true },
  lastName:           { type: String },
  email:              { type: String },
  password:           { type: String },
  phone:              { type: String },
  // role = what they do on site: Employee | Visitor | Guard | Manager | Delivery
  role:               { type: String, default: 'Employee' },
  // mobileRole = what tab/view they see in the companion app
  mobileRole:         { type: String, enum: ['employee','guard','manager','admin'], default: 'employee' },
  status:             { type: String, enum: ['Current','Upcoming','Archived'], default: 'Current' },
  startDate:          { type: Date },
  endDate:            { type: Date },
  // siteId references Project model (the main site/project)
  siteId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  siteName:           { type: String }, // cached site name for fast lookups
  visitorGroupId:     { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup' },
  permissions:        { type: String },  // JSON string
  mobilePaired:       { type: Boolean, default: false },
  mobileDeviceId:     { type: String },
  mobilePairedAt:     { type: Date },
  mobileTokenHash:    { type: String },
  mobileTokenExpiry:  { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Member', memberSchema);

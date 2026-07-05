const mongoose = require('mongoose');

const preRegistrationSchema = new mongoose.Schema({
  siteId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  memberId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  visitorGroupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'VisitorGroup', default: null },
  name:            { type: String, required: true },
  email:           { type: String, default: null },
  phone:           { type: String, default: null },
  notes:           { type: String, default: null },
  expectedDate:    { type: Date, default: null },
  status:          { type: String, default: 'Pending' },  // 'Pending', 'Arrived', 'Cancelled'
}, { timestamps: true });

module.exports = mongoose.model('PreRegistration', preRegistrationSchema);

const mongoose = require('mongoose');

const evacuationReportSchema = new mongoose.Schema({
  siteId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Site' },
  status:           { type: String, enum: ['Active','Completed'], default: 'Active' },
  startedBy:        { type: String },
  endedBy:          { type: String },
  startedAt:        { type: Date, default: Date.now },
  endedAt:          { type: Date },
  durationSeconds:  { type: Number },
  accountedFor:     { type: String },
  leaveReport:      { type: String, default: '' },
  participantsJson: { type: String, default: '[]' },
  notificationsJson:{ type: String, default: '[]' },
}, { timestamps: true });

module.exports = mongoose.model('EvacuationReport', evacuationReportSchema);

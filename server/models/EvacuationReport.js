const mongoose = require('mongoose');

const evacuationReportSchema = new mongoose.Schema({
  siteId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  status:            { type: String, default: 'Active' },   // 'Active', 'Completed'
  startedAt:         { type: Date, default: Date.now },
  startedBy:         { type: String, default: '' },
  endedAt:           { type: Date, default: null },
  endedBy:           { type: String, default: null },
  durationSeconds:   { type: Number, default: null },
  accountedFor:      { type: String, default: '' },
  leaveReport:       { type: String, default: '' },
  participantsJson:  { type: String, default: '[]' },   // JSON array of participant objects
  notificationsJson: { type: String, default: '[]' },   // JSON array of notification objects
}, { timestamps: true });

module.exports = mongoose.model('EvacuationReport', evacuationReportSchema);

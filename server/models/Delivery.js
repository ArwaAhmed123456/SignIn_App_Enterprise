const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  siteId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  recipient: { type: String, required: true },
  itemName: { type: String, default: '' },
  description: { type: String, default: '' },
  carRegistration: { type: String, default: '' },
  company: { type: String, default: '' },
  receivedAt: { type: Date, default: Date.now },
  sender:    { type: String, default: '' },
  carrier:   { type: String, default: '' },
  notes:     { type: String, default: '' },
  collected: { type: Boolean, default: false },
  collectedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);

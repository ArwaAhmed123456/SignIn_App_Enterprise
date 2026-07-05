const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  siteId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  recipient: { type: String, required: true },
  sender:    { type: String, default: '' },
  carrier:   { type: String, default: '' },
  notes:     { type: String, default: '' },
  collected: { type: Boolean, default: false },
  collectedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);

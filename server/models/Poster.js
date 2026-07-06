const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
  siteId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  name:         { type: String, required: true },
  instructions: { type: String, default: '' },
  groups:       [{ type: String }],
  hideHostList: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Poster', posterSchema);

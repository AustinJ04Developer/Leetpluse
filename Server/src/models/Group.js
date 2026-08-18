const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  description: { type: String, default: '' },
  targetDailySolved: { type: Number, default: 2 },
  targetWeeklySolved: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);

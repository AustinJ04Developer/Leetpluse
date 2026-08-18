const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  targetRoles: [{ type: String }],
  updatedBy: { type: String, default: 'DevAdmin' }
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);

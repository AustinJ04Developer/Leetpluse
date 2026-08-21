const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  name: { type: String, required: true }, // e.g. "Computer Science & Engineering"
  code: { type: String, required: true }, // e.g. "CSE"
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

departmentSchema.index({ institutionId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);

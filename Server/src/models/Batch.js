const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  name: { type: String, required: true }, // e.g. "Batch 2026"
  targetDailySolved: { type: Number, default: 2 },
  targetWeeklySolved: { type: Number, default: 10 }
}, { timestamps: true });

batchSchema.index({ institutionId: 1, departmentId: 1, academicYearId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);

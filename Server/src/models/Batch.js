const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false, default: null },
  departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  isCombined: { type: Boolean, default: false },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  targetYearLevel: { type: Number, enum: [1, 2, 3, 4], default: null }, // 1=1st Year, 2=2nd Year, 3=3rd Year (Pre-Final), 4=4th Year (Final), null=All Years
  cohortRange: { type: String, default: '' }, // e.g. "2023-2027"
  name: { type: String, required: true }, // e.g. "Batch 2026" or "Placement Batch 2023-2027"
  targetDailySolved: { type: Number, default: 2 },
  targetWeeklySolved: { type: Number, default: 10 }
}, { timestamps: true });

batchSchema.index({ institutionId: 1, academicYearId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);

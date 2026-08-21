const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  yearLabel: { type: String, required: true }, // e.g. "2026-2027"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isCurrent: { type: Boolean, default: true }
}, { timestamps: true });

academicYearSchema.index({ institutionId: 1, yearLabel: 1 }, { unique: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);

const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  yearLabel: { type: String, required: true }, // e.g. "2026-2027" or "3rd Year (Pre-Final Year)"
  displayName: { type: String, default: '' },
  yearLevel: { type: Number, enum: [1, 2, 3, 4], default: null }, // 1=1st Year, 2=2nd Year, 3=3rd Year (Pre-Final), 4=4th Year (Final)
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
  isCurrent: { type: Boolean, default: true }
}, { timestamps: true });

academicYearSchema.index({ institutionId: 1, yearLabel: 1 }, { unique: true });

module.exports = mongoose.model('AcademicYear', academicYearSchema);

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  name: { type: String, required: true }, // e.g. "Section A"
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

sectionSchema.index({ batchId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);

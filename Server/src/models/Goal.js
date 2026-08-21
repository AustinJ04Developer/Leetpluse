const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null if assigned to section/batch/dept/inst
  title: { type: String, required: true },
  targetSolved: { type: Number, required: true },
  currentSolved: { type: Number, default: 0 },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  completed: { type: Boolean, default: false },

  // Target Assignment Scope
  targetType: { 
    type: String, 
    enum: ['student', 'section', 'batch', 'department', 'institution'], 
    default: 'student' 
  },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);


const mongoose = require('mongoose');

const weeklyProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  problemUrl: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  category: { type: String, default: 'General' },
  weekNumber: { type: Number, required: true },
  year: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notes: { type: String, default: '' },
  assignedToGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }, // null = Everyone
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

weeklyProblemSchema.index({ weekNumber: 1, year: 1 });

module.exports = mongoose.model('WeeklyProblem', weeklyProblemSchema);

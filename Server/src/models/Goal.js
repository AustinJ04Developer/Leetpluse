const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetSolved: { type: Number, required: true },
  currentSolved: { type: Number, default: 0 },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);

const mongoose = require('mongoose');

const submissionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  count: { type: Number, default: 0 },
  easy: { type: Number, default: 0 },
  medium: { type: Number, default: 0 },
  hard: { type: Number, default: 0 },
  submissions: [{
    title: { type: String },
    titleSlug: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    status: { type: String, default: 'Accepted' },
    timestamp: { type: Date }
  }]
}, { timestamps: true });

submissionLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SubmissionLog', submissionLogSchema);

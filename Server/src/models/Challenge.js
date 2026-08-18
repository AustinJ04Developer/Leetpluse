const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetCount: { type: Number, default: 5 },
  difficulty: { type: String, enum: ['All', 'Easy', 'Medium', 'Hard'], default: 'All' },
  deadline: { type: Date, required: true },
  rewardXp: { type: Number, default: 100 },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);

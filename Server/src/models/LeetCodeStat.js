const mongoose = require('mongoose');

const leetCodeStatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  leetcodeUsername: { type: String, required: true },
  totalSolved: { type: Number, default: 0 },
  easySolved: { type: Number, default: 0 },
  mediumSolved: { type: Number, default: 0 },
  hardSolved: { type: Number, default: 0 },
  totalQuestionsCount: { type: Number, default: 3100 },
  acceptanceRate: { type: Number, default: 0 },
  globalRanking: { type: Number, default: 0 },
  contestRating: { type: Number, default: 1500 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  topicMastery: [{
    topic: { type: String },
    solved: { type: Number, default: 0 },
    total: { type: Number, default: 100 }
  }],
  recentSubmissions: [{
    title: { type: String },
    titleSlug: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    status: { type: String, default: 'Accepted' },
    timestamp: { type: Date, default: Date.now },
    topicTags: [{ type: String }]
  }],
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LeetCodeStat', leetCodeStatSchema);

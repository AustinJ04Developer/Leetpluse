const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['devadmin', 'superadmin', 'admin', 'user'], 
    default: 'user' 
  },
  roleLevel: { type: Number, enum: [1, 2, 3, 4], default: 1 },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  leetcodeUsername: { type: String, default: null },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  lastSyncAt: { type: Date, default: null },
  syncStatus: { type: String, enum: ['idle', 'syncing', 'synced', 'error'], default: 'idle' },
  syncErrorMsg: { type: String, default: '' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpire: { type: Date, default: null }
}, { timestamps: true });

// Super Admin has no LeetCode account - force leetcodeUsername to null
userSchema.pre('save', function (next) {
  if (this.role === 'superadmin') {
    this.leetcodeUsername = null;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);

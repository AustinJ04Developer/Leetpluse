const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorEmail: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "USER_IMPERSONATION_START", "ROLE_UPDATED", "FEATURE_FLAG_TOGGLED"
  targetId: { type: String, default: null },
  targetName: { type: String, default: null },
  ipAddress: { type: String, default: '127.0.0.1' },
  metadata: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

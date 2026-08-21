const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  code: { type: String, required: true }, // e.g., "MEC", "MITE"
  logoUrl: { type: String, default: '' },
  primaryColor: { type: String, default: '#6366f1' },
  companyName: { type: String, default: '' },
  customDomain: { type: String, default: '' },
  plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Enterprise' },
  maxUsers: { type: Number, default: 2000 },
  billingStatus: { type: String, enum: ['Active', 'Past Due', 'Trialing'], default: 'Active' },
  settings: {
    inactivityThresholdDays: { type: Number, default: 7 },
    rankingVisibility: { type: String, enum: ['Public', 'InstitutionOnly', 'BatchOnly'], default: 'InstitutionOnly' },
    performanceThresholds: {
      excellent: { type: Number, default: 200 },
      good: { type: Number, default: 100 },
      average: { type: Number, default: 50 },
      needsImprovement: { type: Number, default: 20 }
    }
  },
  staffPasscode: { type: String, default: 'STAFF2026' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);

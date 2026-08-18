const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Enterprise' },
  branding: {
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#6366f1' },
    companyName: { type: String, default: 'TechCorp Academy' },
    customDomain: { type: String, default: '' }
  },
  maxUsers: { type: Number, default: 500 },
  billingStatus: { type: String, enum: ['Active', 'Past Due', 'Trialing'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);

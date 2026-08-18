const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/../../.env' });
const connectDB = require('../config/db');

const User = require('../models/User');
const Organization = require('../models/Organization');
const Group = require('../models/Group');
const LeetCodeStat = require('../models/LeetCodeStat');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const Challenge = require('../models/Challenge');
const FeatureFlag = require('../models/FeatureFlag');
const SystemLog = require('../models/SystemLog');
const AuditLog = require('../models/AuditLog');
const SubmissionLog = require('../models/SubmissionLog');
const bcrypt = require('bcryptjs');

const resetCleanDatabase = async () => {
  try {
    await connectDB();
    console.log('[Clean Engine] Clearing all database collections...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Group.deleteMany({}),
      LeetCodeStat.deleteMany({}),
      Goal.deleteMany({}),
      Notification.deleteMany({}),
      Challenge.deleteMany({}),
      FeatureFlag.deleteMany({}),
      SystemLog.deleteMany({}),
      AuditLog.deleteMany({}),
      SubmissionLog.deleteMany({})
    ]);

    console.log('[Clean Engine] Setting up initial clean Organization & Admin Accounts...');

    const org = await Organization.create({
      name: 'LEETPULSE Academy',
      slug: 'leetpulse-academy',
      plan: 'Enterprise',
      branding: {
        companyName: 'LEETPULSE Academy',
        primaryColor: '#6366f1'
      }
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // Create default Cohort Group
    const groupAlpha = await Group.create({
      name: 'Alpha Cohort 2026',
      orgId: org._id,
      description: 'Primary Engineering Cohort Group'
    });

    // Initial System Accounts
    const devAdmin = await User.create({
      name: 'DevAdmin Account',
      email: 'devadmin@platform.com',
      passwordHash,
      role: 'devadmin',
      roleLevel: 4,
      orgId: org._id,
      groupId: groupAlpha._id,
      leetcodeUsername: 'devadmin_code',
      bio: 'Platform Lead & System Administrator',
      xp: 3200,
      level: 7
    });

    // Set devAdmin as admin of groupAlpha
    groupAlpha.adminId = devAdmin._id;
    await groupAlpha.save();

    const superAdmin = await User.create({
      name: 'SuperAdmin Account',
      email: 'superadmin@platform.com',
      passwordHash,
      role: 'superadmin',
      roleLevel: 3,
      orgId: org._id,
      leetcodeUsername: null,
      bio: 'Executive Management & System Oversight'
    });

    // Generate LeetCode Stats for DevAdmin
    await LeetCodeStat.create({
      userId: devAdmin._id,
      leetcodeUsername: devAdmin.leetcodeUsername,
      totalSolved: 245,
      easySolved: 110,
      mediumSolved: 105,
      hardSolved: 30,
      acceptanceRate: 68.4,
      globalRanking: 34200,
      contestRating: 1810,
      currentStreak: 15,
      longestStreak: 32
    });

    await FeatureFlag.create([
      { key: 'ENABLE_REALTIME_SYNC', description: 'Enable 5-minute background auto-sync via WebSockets', enabled: true },
      { key: 'ADVANCED_RADAR_CHARTS', description: 'Display topic mastery radar charts on user dashboard', enabled: true },
      { key: 'MAINTENANCE_MODE', description: 'Put platform into read-only maintenance mode', enabled: false }
    ]);

    await SystemLog.create([
      { level: 'INFO', module: 'SystemInit', message: 'LEETPULSE production database clean reset complete.' }
    ]);

    await AuditLog.create([
      { actorId: devAdmin._id, actorEmail: devAdmin.email, action: 'CLEAN_DATABASE_INITIALIZED', metadata: { version: '1.0.0' } }
    ]);

    console.log('\n======================================================');
    console.log('✨ LEETPULSE CLEAN DATABASE INITIALIZED!');
    console.log('------------------------------------------------------');
    console.log('1. DevAdmin:   devadmin@platform.com   / Password123!');
    console.log('2. SuperAdmin: superadmin@platform.com / Password123!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Clean Engine] Reset error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  resetCleanDatabase();
}

module.exports = resetCleanDatabase;

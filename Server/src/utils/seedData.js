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
const { generateMockSubmissionHistory } = require('../services/leetcodeService');
const bcrypt = require('bcryptjs');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('[Seed Engine] Clearing old database collections...');

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
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed Engine] Creating LEETPULSE Organization & Cohort Groups...');
    const org = await Organization.create({
      name: 'LEETPULSE Global Academy',
      slug: 'leetpulse-academy',
      plan: 'Enterprise',
      branding: {
        companyName: 'LEETPULSE Academy',
        primaryColor: '#6366f1',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
      }
    });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    // 1. DevAdmin (Level 4 - Tracks self stats + full system access)
    const devAdmin = await User.create({
      name: 'Alex Mercer (DevAdmin)',
      email: 'devadmin@platform.com',
      passwordHash,
      role: 'devadmin',
      roleLevel: 4,
      orgId: org._id,
      leetcodeUsername: 'alexmercer_dev',
      bio: 'Platform Lead & Core Infra Engineer'
    });

    // 2. Super Admin (Level 3 - Management-only, NO personal LeetCode account)
    const superAdmin = await User.create({
      name: 'Elena Vance (SuperAdmin)',
      email: 'superadmin@platform.com',
      passwordHash,
      role: 'superadmin',
      roleLevel: 3,
      orgId: org._id,
      leetcodeUsername: null, // Management-only account, no LeetCode handle
      bio: 'Head of Developer Relations & Enterprise Operations'
    });

    // 3. Admin (Level 2 - Tracks self stats + manages assigned batch)
    const admin = await User.create({
      name: 'Marcus Brody (Cohort Admin)',
      email: 'admin@platform.com',
      passwordHash,
      role: 'admin',
      roleLevel: 2,
      orgId: org._id,
      leetcodeUsername: 'mbrody_code',
      bio: 'Alpha Cohort Manager & Technical Mentor'
    });

    // Create Cohort Groups
    const groupAlpha = await Group.create({
      name: 'Alpha Cohort - 2026',
      orgId: org._id,
      adminId: admin._id,
      description: 'Senior Software Engineering Accelerator Group',
      targetDailySolved: 2,
      targetWeeklySolved: 12
    });

    admin.groupId = groupAlpha._id;
    await admin.save();

    // 4. Primary Test User (Level 1 - Tracks self stats)
    const primaryUser = await User.create({
      name: 'Sarah Connor (User)',
      email: 'user@platform.com',
      passwordHash,
      role: 'user',
      roleLevel: 1,
      orgId: org._id,
      groupId: groupAlpha._id,
      leetcodeUsername: 'sarah_connor',
      bio: 'DSA Enthusiast & Competitive Programmer',
      xp: 2850,
      level: 6,
      badges: ['7-Day Streak', 'Centurion (100 Solved)', 'DP Master']
    });

    // Exclude SuperAdmin from LeetCode stat generation (Management-only role)
    const statUsers = [devAdmin, admin, primaryUser];

    console.log('[Seed Engine] Populating LeetCode Stats & Contribution Heatmaps for active coding accounts...');
    for (const u of statUsers) {
      let easy = Math.floor(Math.random() * 120) + 40;
      let medium = Math.floor(Math.random() * 80) + 20;
      let hard = Math.floor(Math.random() * 25) + 5;

      if (u.email === 'user@platform.com') {
        easy = 120; medium = 85; hard = 18;
      }

      const totalSolved = easy + medium + hard;

      await LeetCodeStat.create({
        userId: u._id,
        leetcodeUsername: u.leetcodeUsername,
        totalSolved,
        easySolved: easy,
        mediumSolved: medium,
        hardSolved: hard,
        acceptanceRate: 64.8,
        globalRanking: 42100,
        contestRating: 1745,
        currentStreak: u.email === 'user@platform.com' ? 12 : Math.floor(Math.random() * 15),
        longestStreak: u.email === 'user@platform.com' ? 24 : Math.floor(Math.random() * 30) + 10,
        topicMastery: [
          { topic: 'Arrays & Strings', solved: Math.floor(easy * 0.6), total: 120 },
          { topic: 'Dynamic Programming', solved: Math.floor(medium * 0.4), total: 90 },
          { topic: 'Trees & Graphs', solved: Math.floor(medium * 0.35), total: 80 },
          { topic: 'Two Pointers & Sliding Window', solved: Math.floor(easy * 0.3), total: 50 },
          { topic: 'Math & Bit Manipulation', solved: Math.floor(hard * 0.5), total: 40 }
        ],
        recentSubmissions: [
          { title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', difficulty: 'Hard', status: 'Accepted', timestamp: new Date(Date.now() - 3600000), topicTags: ['Binary Search', 'Divide and Conquer'] },
          { title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', status: 'Accepted', timestamp: new Date(Date.now() - 86400000), topicTags: ['Two Pointers', 'Array'] },
          { title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', status: 'Accepted', timestamp: new Date(Date.now() - 172800000), topicTags: ['Stack', 'String'] }
        ]
      });

      await generateMockSubmissionHistory(u._id, totalSolved);
    }

    console.log('[Seed Engine] Creating Goals, Notifications & Challenges...');
    await Goal.create({
      userId: primaryUser._id,
      title: 'Solve 15 Medium DP Problems',
      targetSolved: 15,
      currentSolved: 9,
      period: 'weekly',
      endDate: new Date(Date.now() + 5 * 86400000)
    });

    await Notification.create({
      userId: primaryUser._id,
      title: 'Streak Milestone Achieved!',
      message: 'Congratulations! You achieved a 12-day problem solving streak.',
      type: 'badge_earned'
    });

    await Challenge.create({
      title: 'Graph Traversal Sprint',
      description: 'Solve 5 Graph or BFS/DFS problems before Sunday to earn 250 XP bonus.',
      groupId: groupAlpha._id,
      createdBy: admin._id,
      targetCount: 5,
      difficulty: 'Medium',
      deadline: new Date(Date.now() + 4 * 86400000),
      rewardXp: 250
    });

    console.log('[Seed Engine] Populating Feature Flags, Audit & System Logs...');
    await FeatureFlag.create([
      { key: 'ENABLE_REALTIME_SYNC', description: 'Enable 5-minute background auto-sync via WebSockets', enabled: true },
      { key: 'ADVANCED_RADAR_CHARTS', description: 'Display topic mastery radar charts on user dashboard', enabled: true },
      { key: 'MAINTENANCE_MODE', description: 'Put platform into read-only maintenance mode', enabled: false },
      { key: 'BETA_HEATMAP_V2', description: 'Enable high-density GitHub contribution heatmap V2', enabled: true }
    ]);

    await SystemLog.create([
      { level: 'INFO', module: 'SystemBoot', message: 'LEETPULSE Monitoring Engine started successfully on port 5000.' },
      { level: 'INFO', module: 'SyncEngine', message: 'Initial 5-minute sync scheduler active. Total 8 active coding users monitored.' },
      { level: 'WARN', module: 'RateLimiter', message: 'High request rate detected for ip 127.0.0.1 (Handled gracefully).' }
    ]);

    await AuditLog.create([
      { actorId: devAdmin._id, actorEmail: devAdmin.email, action: 'LEETPULSE_INITIALIZED', metadata: { version: '1.0.0' } }
    ]);

    console.log('\n======================================================');
    console.log('⚡ LEETPULSE SEED COMPLETE! TEST ACCOUNTS:');
    console.log('------------------------------------------------------');
    console.log('1. DevAdmin (Level 4):    devadmin@platform.com   / Password123! (Self Stats + Infra)');
    console.log('2. SuperAdmin (Level 3):  superadmin@platform.com / Password123! (Management-Only)');
    console.log('3. Admin (Level 2):       admin@platform.com      / Password123! (Self Stats + Cohort)');
    console.log('4. User (Level 1):        user@platform.com       / Password123! (Self Stats)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Engine] Error seeding database:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;

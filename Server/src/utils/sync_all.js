const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const { syncUserLeetCode } = require('../services/leetcodeService');

async function syncAllUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);

    const users = await User.find({ role: { $ne: 'superadmin' }, leetcodeUsername: { $exists: true, $ne: '' } });
    console.log(`Found ${users.length} users with LeetCode handles to sync...`);

    for (const u of users) {
      console.log(`Syncing user: ${u.name} (@${u.leetcodeUsername})...`);
      const res = await syncUserLeetCode(u);
      console.log(`Result for ${u.name}:`, res.success ? `SUCCESS (Total Solved: ${res.stats?.totalSolved}, Streak: ${res.stats?.currentStreak})` : `FAILED (${res.message})`);
    }

    console.log('All user syncs completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during syncAllUsers script:', err);
    process.exit(1);
  }
}

syncAllUsers();

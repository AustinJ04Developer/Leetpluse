const cron = require('node-cron');
const User = require('../models/User');
const { syncUserLeetCode } = require('./leetcodeService');
const { emitToUser, broadcast } = require('./socketService');
const SystemLog = require('../models/SystemLog');

let syncTaskRunning = false;

const runSyncCycle = async () => {
  if (syncTaskRunning) {
    console.log('[Sync Engine] Previous sync cycle still running, skipping...');
    return;
  }

  syncTaskRunning = true;
  console.log(`[Sync Engine] Starting 5-minute automated sync cycle at ${new Date().toISOString()}...`);

  try {
    // Find all users with linked LeetCode handles
    const users = await User.find({ leetcodeUsername: { $ne: '' }, isActive: true });
    
    if (users.length === 0) {
      console.log('[Sync Engine] No users found with linked LeetCode handles.');
      syncTaskRunning = false;
      return;
    }

    // Adaptive sorting: Active/online users synced first, inactive users lower priority
    const sortedUsers = users.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

    let successCount = 0;
    let failCount = 0;

    // Stagger sync jobs (round-robin delay)
    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];
      
      // Artificial slight delay per user to stagger requests across window
      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await syncUserLeetCode(user);
      if (result.success) {
        successCount++;
        emitToUser(user._id.toString(), 'leetcode:updated', {
          userId: user._id,
          stats: result.stats,
          lastSyncedAt: new Date()
        });
      } else {
        failCount++;
      }
    }

    // Log cycle results to SystemLog for DevAdmin viewer
    await SystemLog.create({
      level: failCount > 0 ? 'WARN' : 'INFO',
      module: 'SyncEngine',
      message: `Completed 5-min sync cycle. Processed ${users.length} users (${successCount} succeeded, ${failCount} failed).`,
      details: { total: users.length, success: successCount, failed: failCount }
    });

    broadcast('sync:cycle_complete', {
      timestamp: new Date(),
      usersSynced: successCount,
      failed: failCount
    });

    console.log(`[Sync Engine] Cycle complete. Succeeded: ${successCount}, Failed: ${failCount}`);
  } catch (err) {
    console.error('[Sync Engine] Error during sync cycle:', err);
    await SystemLog.create({
      level: 'ERROR',
      module: 'SyncEngine',
      message: `Sync cycle fatal error: ${err.message}`,
      details: { stack: err.stack }
    });
  } finally {
    syncTaskRunning = false;
  }
};

const startSyncScheduler = () => {
  // Schedule every 5 minutes: '*/5 * * * *'
  cron.schedule('*/5 * * * *', () => {
    runSyncCycle();
  });
  console.log('[Sync Engine] 5-Minute LeetCode background sync scheduler initialized.');
};

module.exports = { startSyncScheduler, runSyncCycle };

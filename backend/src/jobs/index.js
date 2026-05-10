const cron = require('node-cron');
const db = require('../config/db');

const initJobs = () => {
  // Daily Reset (12 AM) - Reset daily_summons_left to 9 for all users
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily summon reset...');
    try {
      await db.query('UPDATE users SET daily_summons_left = 9 WHERE deleted_at IS NULL');
      console.log('Daily summon reset complete.');
    } catch (err) {
      console.error('Error during daily summon reset:', err);
    }
  });

  // Weekly Cleanup (12 AM on Sundays) - Permanently delete soft-deleted records older than 7 days
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running weekly cleanup of soft-deleted records...');
    try {
      // Delete slimes
      await db.query("DELETE FROM slimes WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      // Delete friendships
      await db.query("DELETE FROM friendships WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      // Delete users (Note: This is more complex due to cascading, but the schema handles cascading)
      await db.query("DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '7 days'");
      
      console.log('Weekly cleanup complete.');
    } catch (err) {
      console.error('Error during weekly cleanup:', err);
    }
  });

  console.log('Background jobs initialized.');
};

module.exports = initJobs;

const db = require('../config/db');

const Interaction = {
  async log({ senderId, targetSlimeId, actionType }) {
    const result = await db.query(
      'INSERT INTO interaction_logs (sender_id, target_slime_id, action_type) VALUES ($1, $2, $3) RETURNING *',
      [senderId, targetSlimeId, actionType]
    );
    return result.rows[0];
  },

  async getRecentForUser(userId, limit = 20) {
    const result = await db.query(
      `SELECT il.*, u.username as sender_username, s.type as slime_type
       FROM interaction_logs il
       JOIN slimes s ON s.id = il.target_slime_id
       JOIN users u ON u.id = il.sender_id
       WHERE s.user_id = $1
       ORDER BY il.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
};

module.exports = Interaction;

const db = require('../config/db');

const Notification = {
  async create({ userId, type, content }) {
    const result = await db.query(
      'INSERT INTO notifications (user_id, type, content) VALUES ($1, $2, $3) RETURNING *',
      [userId, type, JSON.stringify(content)]
    );
    return result.rows[0];
  },

  async findAllByUser(userId, limit = 20) {
    const result = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  },

  async markAsRead(id, userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

module.exports = Notification;

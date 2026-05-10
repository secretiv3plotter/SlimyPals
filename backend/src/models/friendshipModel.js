const db = require('../config/db');

const Friendship = {
  async findFriends(userId) {
    const result = await db.query(
      `SELECT f.id, f.status, f.created_at,
              u.id as friend_id, u.username as friend_username
       FROM friendships f
       JOIN users u ON (u.id = f.user_id OR u.id = f.friend_user_id)
       WHERE (f.user_id = $1 OR f.friend_user_id = $1)
       AND u.id != $1
       AND f.status = 'accepted'
       AND f.deleted_at IS NULL`,
      [userId]
    );
    return result.rows;
  },

  async findPendingRequests(userId) {
    const result = await db.query(
      `SELECT f.id, f.created_at,
              u.id as sender_id, u.username as sender_username
       FROM friendships f
       JOIN users u ON u.id = f.user_id
       WHERE f.friend_user_id = $1
       AND f.status = 'pending'
       AND f.deleted_at IS NULL`,
      [userId]
    );
    return result.rows;
  },

  async findSentRequests(userId) {
    const result = await db.query(
      `SELECT f.id, f.created_at,
              u.id as receiver_id, u.username as receiver_username
       FROM friendships f
       JOIN users u ON u.id = f.friend_user_id
       WHERE f.user_id = $1
       AND f.status = 'pending'
       AND f.deleted_at IS NULL`,
      [userId]
    );
    return result.rows;
  },

  async findRequest(senderId, receiverId) {
    const result = await db.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_user_id = $2) 
          OR (user_id = $2 AND friend_user_id = $1))
       AND deleted_at IS NULL`,
      [senderId, receiverId]
    );
    return result.rows[0];
  },

  async create(senderId, receiverId) {
    const result = await db.query(
      'INSERT INTO friendships (user_id, friend_user_id, status) VALUES ($1, $2, \'pending\') RETURNING *',
      [senderId, receiverId]
    );
    return result.rows[0];
  },

  async accept(id, userId) {
    const result = await db.query(
      'UPDATE friendships SET status = \'accepted\' WHERE id = $1 AND friend_user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  },

  async remove(id, userId) {
    const result = await db.query(
      'UPDATE friendships SET deleted_at = NOW() WHERE id = $1 AND (user_id = $2 OR friend_user_id = $2) RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  },

  async countAccepted(userId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM friendships WHERE (user_id = $1 OR friend_user_id = $1) AND status = \'accepted\' AND deleted_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
};

module.exports = Friendship;

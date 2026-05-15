const db = require('../config/db');

const countAcceptedWithClient = async (client, userId) => {
  const result = await client.query(
    `SELECT COUNT(*)
     FROM friendships
     WHERE (user_id = $1 OR friend_user_id = $1)
     AND status = 'accepted'
     AND deleted_at IS NULL`,
    [userId]
  );

  return parseInt(result.rows[0].count);
};

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
       AND f.deleted_at IS NULL
       AND u.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
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
       AND f.deleted_at IS NULL
       AND u.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
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
       AND f.deleted_at IS NULL
       AND u.deleted_at IS NULL
       ORDER BY f.created_at DESC`,
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
    const restored = await db.query(
      `UPDATE friendships
       SET status = 'pending',
           deleted_at = NULL,
           created_at = NOW()
       WHERE user_id = $1
       AND friend_user_id = $2
       AND deleted_at IS NOT NULL
       RETURNING *`,
      [senderId, receiverId]
    );

    if (restored.rows[0]) {
      return restored.rows[0];
    }

    const result = await db.query(
      'INSERT INTO friendships (user_id, friend_user_id, status) VALUES ($1, $2, \'pending\') RETURNING *',
      [senderId, receiverId]
    );
    return result.rows[0];
  },

  async acceptWithFriendLimit(id, receiverId, maxFriends) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const requestResult = await client.query(
        `SELECT *
         FROM friendships
         WHERE id = $1
         AND friend_user_id = $2
         AND status = 'pending'
         AND deleted_at IS NULL
         FOR UPDATE`,
        [id, receiverId]
      );

      const request = requestResult.rows[0];
      if (!request) {
        await client.query('ROLLBACK');
        return { status: 'not_found' };
      }

      const lockedUserIds = [request.user_id, request.friend_user_id].sort();
      for (const lockedUserId of lockedUserIds) {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockedUserId]);
      }

      const senderFriendCount = await countAcceptedWithClient(client, request.user_id);
      const receiverFriendCount = await countAcceptedWithClient(client, request.friend_user_id);

      if (senderFriendCount >= maxFriends || receiverFriendCount >= maxFriends) {
        await client.query('ROLLBACK');
        return { status: 'friend_limit' };
      }

      const acceptedResult = await client.query(
        `UPDATE friendships
         SET status = 'accepted'
         WHERE id = $1
         AND friend_user_id = $2
         AND status = 'pending'
         AND deleted_at IS NULL
         RETURNING *`,
        [id, receiverId]
      );

      await client.query('COMMIT');

      return {
        status: 'accepted',
        friendship: acceptedResult.rows[0]
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async remove(id, userId) {
    const result = await db.query(
      `UPDATE friendships
       SET deleted_at = NOW()
       WHERE id = $1
       AND (user_id = $2 OR friend_user_id = $2)
       AND deleted_at IS NULL
       RETURNING *`,
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

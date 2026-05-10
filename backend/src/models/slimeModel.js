const db = require('../config/db');

const Slime = {
  async findAllByUser(userId) {
    const result = await db.query(
      'SELECT * FROM slimes WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(
      'SELECT * FROM slimes WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  },

  async create({ userId, rarity, type, color, level }) {
    const result = await db.query(
      `INSERT INTO slimes (user_id, rarity, type, color, level, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING *`,
      [userId, rarity, type, color, level || 1]
    );
    return result.rows[0];
  },

  async update(id, { level, last_fed_at }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (level !== undefined) {
      fields.push(`level = $${idx++}`);
      values.push(level);
    }
    if (last_fed_at !== undefined) {
      fields.push(`last_fed_at = $${idx++}`);
      values.push(last_fed_at);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE slimes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await db.query(
      'UPDATE slimes SET deleted_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async countActiveByUser(userId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM slimes WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
};

module.exports = Slime;

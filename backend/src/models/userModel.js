const db = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  async create({ username, password }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, passwordHash]
    );

    // Initialize food factory for new user
    await db.query(
      'INSERT INTO food_factory_stock (user_id, quantity) VALUES ($1, 0)',
      [result.rows[0].id]
    );

    return result.rows[0];
  },

  async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL',
      [username]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id, username, daily_summons_left, max_slime_capacity, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0];
  },

  async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  }
};

module.exports = User;

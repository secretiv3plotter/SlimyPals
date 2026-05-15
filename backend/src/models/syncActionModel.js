const db = require('../config/db');

let ensureTablePromise = null;

function ensureTable() {
  if (!ensureTablePromise) {
    ensureTablePromise = db.query(`
      CREATE TABLE IF NOT EXISTS sync_actions (
        client_action_id TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('accepted', 'rejected')),
        error_code VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (client_action_id, user_id)
      )
    `);
  }

  return ensureTablePromise;
}

const SyncAction = {
  async find(clientActionId, userId) {
    await ensureTable();
    const result = await db.query(
      'SELECT * FROM sync_actions WHERE client_action_id = $1 AND user_id = $2',
      [clientActionId, userId]
    );

    return result.rows[0];
  },

  async create({ clientActionId, errorCode = null, status, userId }) {
    await ensureTable();
    const result = await db.query(
      `INSERT INTO sync_actions (client_action_id, user_id, status, error_code)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (client_action_id, user_id) DO NOTHING
       RETURNING *`,
      [clientActionId, userId, status, errorCode]
    );

    return result.rows[0] || this.find(clientActionId, userId);
  }
};

module.exports = SyncAction;

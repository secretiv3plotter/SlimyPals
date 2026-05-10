const db = require('../config/db');

const FoodFactory = {
  async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM food_factory_stock WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0];
  },

  async produce(userId, amount) {
    const result = await db.query(
      `UPDATE food_factory_stock 
       SET quantity = LEAST(quantity + $1, 100), 
           last_produced_at = NOW() 
       WHERE user_id = $2 
       RETURNING *`,
      [amount, userId]
    );
    return result.rows[0];
  },

  async updateStock(userId, quantityChange) {
    const result = await db.query(
      'UPDATE food_factory_stock SET quantity = quantity + $1 WHERE user_id = $2 RETURNING *',
      [quantityChange, userId]
    );
    return result.rows[0];
  }
};

module.exports = FoodFactory;

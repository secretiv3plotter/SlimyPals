const Slime = require('../models/slimeModel');
const User = require('../models/userModel');
const FoodFactory = require('../models/foodFactoryModel');
const slimeService = require('../services/slimeService');
const db = require('../config/db');
const presenceManager = require('../sockets/presenceManager');

exports.listMySlimes = async (req, res, next) => {
  try {
    const slimes = await Slime.findAllByUser(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { slimes }
    });
  } catch (err) {
    next(err);
  }
};

exports.summonSlime = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check daily summon limit
    if (user.daily_summons_left <= 0) {
      return res.status(400).json({ 
        error: { message: 'Daily summon limit reached (9/day)', code: 'LIMIT_REACHED' } 
      });
    }

    // Check capacity
    const activeCount = await Slime.countActiveByUser(req.user.id);
    if (activeCount >= user.max_slime_capacity) {
      return res.status(400).json({ 
        error: { message: 'Max slime capacity reached (25)', code: 'CAPACITY_REACHED' } 
      });
    }

    const slimeData = slimeService.generateRandomSlime();
    
    // Transaction to update user limit and create slime
    await db.query('BEGIN');
    try {
      const userResult = await db.query(
        `UPDATE users
         SET daily_summons_left = daily_summons_left - 1
         WHERE id = $1
         RETURNING id, username, daily_summons_left, max_slime_capacity, created_at`,
        [req.user.id]
      );
      
      const newSlime = await Slime.create({
        userId: req.user.id,
        ...slimeData
      });
      
      await db.query('COMMIT');
      broadcastSlimeDomainEvent(req.user.id, 'domain.slime.created', {
        slime: newSlime,
        user: userResult.rows[0]
      });
      
      res.status(201).json({
        status: 'success',
        data: {
          slime: newSlime,
          user: userResult.rows[0]
        }
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.feedSlime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slime = await Slime.findById(id);

    if (!slime || slime.user_id !== req.user.id) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    if (slime.level >= 3) {
      return res.status(400).json({ error: { message: 'Slime is already at max level' } });
    }

    // Check cooldown (6 hours)
    if (slime.last_fed_at) {
      const lastFed = new Date(slime.last_fed_at);
      const now = new Date();
      const diffHours = (now - lastFed) / (1000 * 60 * 60);
      if (diffHours < 6) {
        return res.status(400).json({ 
          error: { message: `Slime is not hungry. Next feed in ${Math.ceil(6 - diffHours)} hours.` } 
        });
      }
    }

    // Check food stock
    const factory = await FoodFactory.findByUserId(req.user.id);
    if (!factory || factory.quantity <= 0) {
      return res.status(400).json({ error: { message: 'No slime food available' } });
    }

    // Transaction to consume food and level up slime
    await db.query('BEGIN');
    try {
      const updatedFactory = await FoodFactory.updateStock(req.user.id, -1);
      
      const updatedSlime = await Slime.update(id, {
        level: slime.level + 1,
        last_fed_at: new Date()
      });
      
      await db.query('COMMIT');
      sendUserDomainEvent(req.user.id, 'domain.food.updated', {
        foodFactoryStock: updatedFactory
      });
      broadcastSlimeDomainEvent(req.user.id, 'domain.slime.updated', {
        slime: updatedSlime
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          factory: updatedFactory,
          slime: updatedSlime
        }
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteSlime = async (req, res, next) => {
  try {
    const { id } = req.params;
    const slime = await Slime.findById(id);

    if (!slime || slime.user_id !== req.user.id) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    await Slime.delete(id);
    broadcastSlimeDomainEvent(req.user.id, 'domain.slime.deleted', {
      slimeId: id
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

function broadcastSlimeDomainEvent(userId, type, payload = {}) {
  const event = {
    type,
    payload: {
      ...payload,
      userId
    }
  };

  presenceManager.sendToUser(userId, event);
  presenceManager.broadcastToFriends(userId, event);
}

function sendUserDomainEvent(userId, type, payload = {}) {
  presenceManager.sendToUser(userId, {
    type,
    payload: {
      ...payload,
      userId
    }
  });
}

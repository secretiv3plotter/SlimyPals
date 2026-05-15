const FoodFactory = require('../models/foodFactoryModel');
const Slime = require('../models/slimeModel');
const presenceManager = require('../sockets/presenceManager');

exports.getFoodFactory = async (req, res, next) => {
  try {
    const factory = await FoodFactory.findByUserId(req.user.id);
    
    if (!factory) {
      return res.status(404).json({ error: { message: 'Food factory not found' } });
    }

    // Determine if production is available today
    let canProduceToday = true;
    if (factory.last_produced_at) {
      const lastProduced = new Date(factory.last_produced_at);
      const now = new Date();
      
      if (
        lastProduced.getFullYear() === now.getFullYear() &&
        lastProduced.getMonth() === now.getMonth() &&
        lastProduced.getDate() === now.getDate()
      ) {
        canProduceToday = false;
      }
    }

    res.status(200).json({
      status: 'success',
      data: { 
        factory,
        canProduceToday
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.produceFood = async (req, res, next) => {
  try {
    const factory = await FoodFactory.findByUserId(req.user.id);
    const now = new Date();

    // 1. Check if already produced today
    if (factory.last_produced_at) {
      const lastProduced = new Date(factory.last_produced_at);
      if (
        lastProduced.getFullYear() === now.getFullYear() &&
        lastProduced.getMonth() === now.getMonth() &&
        lastProduced.getDate() === now.getDate()
      ) {
        return res.status(400).json({ 
          error: { message: 'Food factory has already produced today.', code: 'ALREADY_PRODUCED' } 
        });
      }
    }

    // 2. Check slime count
    const activeSlimeCount = await Slime.countActiveByUser(req.user.id);
    if (activeSlimeCount <= 0) {
      return res.status(400).json({ 
        error: { message: 'You need at least one slime to produce food.', code: 'NO_SLIMES' } 
      });
    }

    // 3. Check if stock is already full
    if (factory.quantity >= 100) {
      return res.status(400).json({ 
        error: { message: 'Food stock is already full (100).', code: 'STOCK_FULL' } 
      });
    }

    // 4. Produce food (amount = slime count)
    const updatedFactory = await FoodFactory.produce(req.user.id, activeSlimeCount);
    presenceManager.sendToUser(req.user.id, {
      type: 'domain.food.updated',
      payload: {
        foodFactoryStock: updatedFactory,
        producedQuantity: activeSlimeCount,
        userId: req.user.id
      }
    });

    res.status(200).json({
      status: 'success',
      data: { 
        factory: updatedFactory,
        producedAmount: activeSlimeCount
      }
    });
  } catch (err) {
    next(err);
  }
};

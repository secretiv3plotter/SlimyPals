const FoodFactory = require('../models/foodFactoryModel');
const Friendship = require('../models/friendshipModel');
const Slime = require('../models/slimeModel');
const User = require('../models/userModel');

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_UNAVAILABLE',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({ user: toDomainUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.getMyDomain = async (req, res, next) => {
  try {
    const [user, slimes, foodFactoryStock, friends] = await Promise.all([
      User.findById(req.user.id),
      Slime.findAllByUser(req.user.id),
      FoodFactory.findByUserId(req.user.id),
      Friendship.findFriends(req.user.id),
    ]);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_UNAVAILABLE',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      user: toDomainUser(user),
      slimes: slimes.map(toDomainSlime),
      foodFactoryStock: toDomainFoodFactoryStock(foodFactoryStock, req.user.id),
      foodProductionReadiness: getFoodProductionReadiness({
        activeSlimeCount: slimes.length,
        foodFactoryStock,
      }),
      friends: friends.map(toDomainFriend),
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

exports.getTimers = async (req, res, next) => {
  try {
    const [slimes, foodFactoryStock] = await Promise.all([
      Slime.findAllByUser(req.user.id),
      FoodFactory.findByUserId(req.user.id),
    ]);

    res.status(200).json({
      foodProductionReadiness: getFoodProductionReadiness({
        activeSlimeCount: slimes.length,
        foodFactoryStock,
      }),
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

function getFoodProductionReadiness({ activeSlimeCount, foodFactoryStock }) {
  const currentFoodQuantity = foodFactoryStock?.quantity ?? 0;
  const canProduceToday = !isSameServerDay(foodFactoryStock?.last_produced_at, new Date());
  const allowed = activeSlimeCount > 0 && currentFoodQuantity < 100 && canProduceToday;

  return {
    activeSlimeCount,
    allowed,
    currentFoodQuantity,
    maxFoodStock: 100,
    producedQuantity: allowed ? Math.min(activeSlimeCount, 100 - currentFoodQuantity) : 0,
    reason: allowed ? null : getFoodProductionBlockedReason({
      activeSlimeCount,
      canProduceToday,
      currentFoodQuantity,
    }),
  };
}

function getFoodProductionBlockedReason({ activeSlimeCount, canProduceToday, currentFoodQuantity }) {
  if (activeSlimeCount <= 0) {
    return 'NO_ACTIVE_SLIMES';
  }

  if (currentFoodQuantity >= 100) {
    return 'FOOD_STOCK_FULL';
  }

  if (!canProduceToday) {
    return 'FOOD_ALREADY_PRODUCED_TODAY';
  }

  return null;
}

function isSameServerDay(value, now) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function toDomainUser(user) {
  return {
    id: user.id,
    username: user.username,
    dailySummonsLeft: user.daily_summons_left,
    maxSlimeCapacity: user.max_slime_capacity,
    createdAt: toIso(user.created_at),
    deletedAt: toIso(user.deleted_at),
    lastDailyResetAt: toIso(user.last_login),
  };
}

function toDomainSlime(slime) {
  return {
    id: slime.id,
    userId: slime.user_id,
    rarity: slime.rarity,
    type: slime.type,
    color: slime.color,
    level: slime.level,
    lastFedAt: toIso(slime.last_fed_at),
    createdAt: toIso(slime.created_at),
    deletedAt: toIso(slime.deleted_at),
  };
}

function toDomainFoodFactoryStock(stock, fallbackUserId) {
  if (!stock) {
    return null;
  }

  return {
    id: stock.id,
    userId: stock.user_id || fallbackUserId,
    quantity: stock.quantity,
    lastProducedAt: toIso(stock.last_produced_at),
    createdAt: toIso(stock.created_at),
    deletedAt: toIso(stock.deleted_at),
  };
}

function toDomainFriend(friend) {
  return {
    id: friend.friend_id,
    username: friend.friend_username,
    friendshipId: friend.id,
    status: friend.status,
    createdAt: toIso(friend.created_at),
    online: Boolean(friend.online),
  };
}

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

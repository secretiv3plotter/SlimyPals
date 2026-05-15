const FoodFactory = require('../models/foodFactoryModel');
const Friendship = require('../models/friendshipModel');
const Interaction = require('../models/interactionModel');
const Slime = require('../models/slimeModel');
const SyncAction = require('../models/syncActionModel');
const db = require('../config/db');
const presenceManager = require('../sockets/presenceManager');

const SYNC_ACTION_TYPES = Object.freeze({
  DELETE_OWN_SLIME: 'deleteOwnSlime',
  FEED_FRIEND_SLIME: 'feedFriendSlime',
  FEED_OWN_SLIME: 'feedOwnSlime',
  POKE_FRIEND_SLIME: 'pokeFriendSlime',
  PRODUCE_FOOD: 'produceFood',
  SUMMON_SLIME: 'summonSlime',
});

exports.syncActions = async (req, res, next) => {
  try {
    const actions = Array.isArray(req.body.actions) ? req.body.actions : [];
    const accepted = [];
    const rejected = [];

    for (const action of actions) {
      const result = await applySyncAction(action, req.user);

      if (result.status === 'accepted') {
        accepted.push(result);
      } else {
        rejected.push(result);
      }
    }

    res.status(200).json({ accepted, rejected });
  } catch (err) {
    next(err);
  }
};

async function applySyncAction(action, user) {
  const clientActionId = action?.clientActionId || action?.id || action?.client_action_id;
  const type = action?.type;
  const payload = action?.payload || {};

  if (!clientActionId) {
    return rejectedResult(null, 'SYNC_ACTION_ID_REQUIRED');
  }

  const existing = await SyncAction.find(clientActionId, user.id);
  if (existing) {
    return existing.status === 'accepted'
      ? acceptedResult(clientActionId)
      : rejectedResult(clientActionId, existing.error_code || 'SYNC_ACTION_REJECTED');
  }

  try {
    await applyActionByType({ payload, type, user });
    await SyncAction.create({ clientActionId, status: 'accepted', userId: user.id });
    return acceptedResult(clientActionId);
  } catch (error) {
    const errorCode = error.code || 'SYNC_ACTION_FAILED';
    await SyncAction.create({
      clientActionId,
      errorCode,
      status: 'rejected',
      userId: user.id,
    });
    return rejectedResult(clientActionId, errorCode);
  }
}

async function applyActionByType({ payload, type, user }) {
  if (payload.userId && payload.userId !== user.id) {
    throw syncError('SYNC_USER_MISMATCH');
  }

  if (type === SYNC_ACTION_TYPES.SUMMON_SLIME) {
    await syncSummonSlime({ payload, user });
    return;
  }

  if (type === SYNC_ACTION_TYPES.PRODUCE_FOOD) {
    await syncProduceFood({ payload, user });
    return;
  }

  if (type === SYNC_ACTION_TYPES.FEED_OWN_SLIME) {
    await syncFeedOwnSlime({ payload, user });
    return;
  }

  if (type === SYNC_ACTION_TYPES.DELETE_OWN_SLIME) {
    await syncDeleteOwnSlime({ payload, user });
    return;
  }

  if (type === SYNC_ACTION_TYPES.FEED_FRIEND_SLIME) {
    await syncFeedFriendSlime({ payload, user });
    return;
  }

  if (type === SYNC_ACTION_TYPES.POKE_FRIEND_SLIME) {
    await syncPokeFriendSlime({ payload, user });
    return;
  }

  throw syncError('UNKNOWN_SYNC_ACTION_TYPE');
}

async function syncSummonSlime({ payload, user }) {
  const slime = payload.slime;
  const slimeId = payload.slimeId || slime?.id;

  if (!slimeId || !slime?.rarity || !slime?.type || !slime?.color) {
    throw syncError('SUMMON_SLIME_PAYLOAD_INCOMPLETE');
  }

  const existingSlime = await Slime.findById(slimeId);
  if (existingSlime) {
    if (existingSlime.user_id !== user.id) {
      throw syncError('SLIME_OWNER_MISMATCH');
    }

    return;
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
      [user.id]
    );
    const serverUser = userResult.rows[0];
    if (!serverUser || serverUser.daily_summons_left <= 0) {
      throw syncError('DAILY_SUMMON_LIMIT_REACHED');
    }

    const activeCountResult = await client.query(
      'SELECT COUNT(*) FROM slimes WHERE user_id = $1 AND deleted_at IS NULL',
      [user.id]
    );
    const activeCount = parseInt(activeCountResult.rows[0].count);
    if (activeCount >= serverUser.max_slime_capacity) {
      throw syncError('DOMAIN_CAPACITY_REACHED');
    }

    await client.query(
      'UPDATE users SET daily_summons_left = GREATEST(daily_summons_left - 1, 0) WHERE id = $1',
      [user.id]
    );
    await client.query(
      `INSERT INTO slimes (id, user_id, rarity, type, color, level, last_fed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
       ON CONFLICT (id) DO NOTHING`,
      [
        slimeId,
        user.id,
        slime.rarity,
        slime.type,
        slime.color,
        slime.level || 1,
        slime.last_fed_at || slime.lastFedAt || null,
        slime.created_at || slime.createdAt || payload.createdAt || null,
      ]
    );
    await client.query('COMMIT');
    notifyFriendsDomainChanged(user.id, {
      action: 'domain.slime.created',
      slimeId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function syncProduceFood({ payload, user }) {
  const producedQuantity = Number(payload.producedQuantity);

  if (!Number.isFinite(producedQuantity) || producedQuantity <= 0) {
    throw syncError('PRODUCE_FOOD_PAYLOAD_INCOMPLETE');
  }

  const activeSlimeCount = await Slime.countActiveByUser(user.id);
  if (activeSlimeCount <= 0) {
    throw syncError('NO_ACTIVE_SLIMES');
  }

  const amount = Math.min(producedQuantity, activeSlimeCount);
  await FoodFactory.produce(user.id, amount);
}

async function syncFeedOwnSlime({ payload, user }) {
  const slime = await Slime.findById(payload.slimeId);
  if (!slime || slime.user_id !== user.id) {
    throw syncError('SLIME_UNAVAILABLE');
  }

  if (slime.level >= 3) {
    return;
  }

  const factory = await FoodFactory.findByUserId(user.id);
  if (!factory || factory.quantity <= 0) {
    throw syncError('NO_FOOD_AVAILABLE');
  }

  await FoodFactory.updateStock(user.id, -1);
  await Slime.update(slime.id, {
    level: slime.level + 1,
    last_fed_at: new Date(),
  });
  notifyFriendsDomainChanged(user.id, {
    action: 'domain.slime.updated',
    slimeId: slime.id,
  });
}

async function syncDeleteOwnSlime({ payload, user }) {
  const slime = await Slime.findById(payload.slimeId);
  if (!slime) {
    return;
  }

  if (slime.user_id !== user.id) {
    throw syncError('SLIME_OWNER_MISMATCH');
  }

  await Slime.delete(slime.id);
  notifyFriendsDomainChanged(user.id, {
    action: 'domain.slime.deleted',
    slimeId: slime.id,
  });
}

async function syncFeedFriendSlime({ payload, user }) {
  const { friendUserId, slimeId } = payload;
  await assertAcceptedFriendship(user.id, friendUserId);

  const slime = await Slime.findById(slimeId);
  if (!slime || slime.user_id !== friendUserId) {
    throw syncError('SLIME_UNAVAILABLE');
  }

  if (slime.level >= 3) {
    return;
  }

  const factory = await FoodFactory.findByUserId(user.id);
  if (!factory || factory.quantity <= 0) {
    throw syncError('NO_FOOD_AVAILABLE');
  }

  await FoodFactory.updateStock(user.id, -1);
  const updatedSlime = await Slime.update(slime.id, {
    level: slime.level + 1,
    last_fed_at: new Date(),
  });
  const interaction = await Interaction.log({
    actionType: 'feed',
    senderId: user.id,
    targetSlimeId: slime.id,
  });
  notifyFriendsDomainChanged(friendUserId, {
    action: 'domain.slime.updated',
    slime: updatedSlime,
    slimeId: slime.id,
  });
  notifyInteractionCreated(friendUserId, {
    actionType: 'feed',
    interaction,
    senderId: user.id,
    senderUsername: user.username,
    slimeId: slime.id,
  });
}

async function syncPokeFriendSlime({ payload, user }) {
  const { friendUserId, slimeId } = payload;
  await assertAcceptedFriendship(user.id, friendUserId);

  const slime = await Slime.findById(slimeId);
  if (!slime || slime.user_id !== friendUserId) {
    throw syncError('SLIME_UNAVAILABLE');
  }

  const interaction = await Interaction.log({
    actionType: 'poke',
    senderId: user.id,
    targetSlimeId: slime.id,
  });
  notifyInteractionCreated(friendUserId, {
    actionType: 'poke',
    interaction,
    senderId: user.id,
    senderUsername: user.username,
    slimeId: slime.id,
  });
}

async function assertAcceptedFriendship(userId, friendUserId) {
  const friendship = await Friendship.findRequest(userId, friendUserId);
  if (!friendship || friendship.status !== 'accepted') {
    throw syncError('FRIENDSHIP_UNAVAILABLE');
  }
}

function notifyFriendsDomainChanged(userId, payload) {
  presenceManager.broadcastToFriends(userId, {
    type: payload.action || 'friend.list.changed',
    payload,
  });
}

function notifyInteractionCreated(ownerUserId, payload) {
  const event = {
    type: 'interaction.created',
    payload: {
      ...payload,
      ownerUserId,
    },
  };

  presenceManager.sendToUser(ownerUserId, event);
  presenceManager.broadcastToFriends(ownerUserId, event);
}

function acceptedResult(clientActionId) {
  return { clientActionId, status: 'accepted' };
}

function rejectedResult(clientActionId, errorCode) {
  return {
    clientActionId,
    error: { code: errorCode },
    status: 'rejected',
  };
}

function syncError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

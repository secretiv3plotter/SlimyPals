const FoodFactory = require('../models/foodFactoryModel');
const Friendship = require('../models/friendshipModel');
const Interaction = require('../models/interactionModel');
const Slime = require('../models/slimeModel');
const SyncAction = require('../models/syncActionModel');
const presenceManager = require('../sockets/presenceManager');
const db = require('../config/db');

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
    const realtimeEvents = await applyActionByType({ payload, type, user });
    await SyncAction.create({ clientActionId, status: 'accepted', userId: user.id });
    emitSyncRealtimeEvents(realtimeEvents);
    return acceptedResult(clientActionId, realtimeEvents);
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
    return syncSummonSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.PRODUCE_FOOD) {
    return syncProduceFood({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.FEED_OWN_SLIME) {
    return syncFeedOwnSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.DELETE_OWN_SLIME) {
    return syncDeleteOwnSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.FEED_FRIEND_SLIME) {
    return syncFeedFriendSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.POKE_FRIEND_SLIME) {
    return syncPokeFriendSlime({ payload, user });
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

    return [];
  }

  let createdSlime = null;
  let updatedUser = null;
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

    const updatedUserResult = await client.query(
      `UPDATE users
       SET daily_summons_left = GREATEST(daily_summons_left - 1, 0)
       WHERE id = $1
       RETURNING id, username, daily_summons_left, max_slime_capacity, created_at`,
      [user.id]
    );
    updatedUser = updatedUserResult.rows[0];
    const slimeResult = await client.query(
      `INSERT INTO slimes (id, user_id, rarity, type, color, level, last_fed_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
       ON CONFLICT (id) DO NOTHING
       RETURNING *`,
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
    if (slimeResult.rows[0]) {
      createdSlime = slimeResult.rows[0];
    } else {
      const existingSlimeResult = await client.query(
        'SELECT * FROM slimes WHERE id = $1 AND deleted_at IS NULL',
        [slimeId]
      );
      createdSlime = existingSlimeResult.rows[0];
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return [
    createDomainEvent(user.id, 'domain.slime.created', {
      slime: createdSlime,
      user: updatedUser,
    }),
  ];
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
  const foodFactoryStock = await FoodFactory.produce(user.id, amount);

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
      producedQuantity: amount,
    }),
  ];
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

  const foodFactoryStock = await FoodFactory.updateStock(user.id, -1);
  const updatedSlime = await Slime.update(slime.id, {
    level: slime.level + 1,
    last_fed_at: new Date(),
  });

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
    }),
    createDomainEvent(user.id, 'domain.slime.updated', {
      slime: updatedSlime,
    }),
  ];
}

async function syncDeleteOwnSlime({ payload, user }) {
  const slime = await Slime.findById(payload.slimeId);
  if (!slime) {
    return [];
  }

  if (slime.user_id !== user.id) {
    throw syncError('SLIME_OWNER_MISMATCH');
  }

  await Slime.delete(slime.id);

  return [
    createDomainEvent(user.id, 'domain.slime.deleted', {
      slimeId: slime.id,
    }),
  ];
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

  const foodFactoryStock = await FoodFactory.updateStock(user.id, -1);
  const updatedSlime = await Slime.update(slime.id, {
    level: slime.level + 1,
    last_fed_at: new Date(),
  });
  const interaction = await Interaction.log({
    actionType: 'feed',
    senderId: user.id,
    targetSlimeId: slime.id,
  });

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
    }),
    createDomainEvent(friendUserId, 'domain.slime.updated', {
      slime: updatedSlime,
    }),
    createDomainEvent(friendUserId, 'interaction.created', {
      actionType: 'feed',
      interaction,
      ownerUserId: friendUserId,
      senderId: user.id,
      senderUsername: user.username,
      slimeId: slime.id,
    }),
  ];
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

  return [
    createDomainEvent(friendUserId, 'interaction.created', {
      actionType: 'poke',
      interaction,
      ownerUserId: friendUserId,
      senderId: user.id,
      senderUsername: user.username,
      slimeId: slime.id,
    }),
  ];
}

async function assertAcceptedFriendship(userId, friendUserId) {
  const friendship = await Friendship.findRequest(userId, friendUserId);
  if (!friendship || friendship.status !== 'accepted') {
    throw syncError('FRIENDSHIP_UNAVAILABLE');
  }
}

function acceptedResult(clientActionId, realtimeEvents = []) {
  return {
    clientActionId,
    realtimeEvents: realtimeEvents.map((event) => ({
      payload: event.payload,
      type: event.type,
    })),
    status: 'accepted',
  };
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

function createDomainEvent(userId, type, payload = {}) {
  return {
    audience: 'domain',
    type,
    userId,
    payload: {
      ...payload,
      userId,
    },
  };
}

function createOwnerEvent(userId, type, payload = {}) {
  return {
    audience: 'owner',
    type,
    userId,
    payload: {
      ...payload,
      userId,
    },
  };
}

function emitSyncRealtimeEvents(events = []) {
  events.forEach((event) => {
    if (!event) return;

    const message = {
      type: event.type,
      payload: event.payload,
    };

    presenceManager.sendToUser(event.userId, message);

    if (event.audience === 'domain') {
      presenceManager.broadcastToFriends(event.userId, message);
    }
  });
}

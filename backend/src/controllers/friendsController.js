const Friendship = require('../models/friendshipModel');
const User = require('../models/userModel');
const Slime = require('../models/slimeModel');
const FoodFactory = require('../models/foodFactoryModel');
const Interaction = require('../models/interactionModel');
const presenceManager = require('../sockets/presenceManager');
const db = require('../config/db');

const MAX_FRIENDS = 4;

async function notifyFriendshipAccepted(friendship, action = 'friend.request.accepted') {
  await presenceManager.refreshUsersFriends([friendship.user_id, friendship.friend_user_id]);
  presenceManager.sendFriendListChangedToUsers([friendship.user_id, friendship.friend_user_id], {
    action,
    friendshipId: friendship.id
  });
}

exports.listFriends = async (req, res, next) => {
  try {
    const friends = await Friendship.findFriends(req.user.id);
    const pending = await Friendship.findPendingRequests(req.user.id);
    const sent = await Friendship.findSentRequests(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: { 
        friends: friends.map(friend => ({
          ...friend,
          online: presenceManager.isUserOnline(friend.friend_id)
        })),
        pending, // Incoming
        sent     // Outgoing
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const userId = (req.body.userId || req.body.friendUserId || req.body.targetUserId || req.body.id || '').trim();

    if (!username && !userId) {
      return res.status(400).json({
        error: {
          message: 'Username or userId is required',
          code: 'FRIEND_TARGET_REQUIRED'
        }
      });
    }

    const targetUser = userId
      ? await User.findById(userId)
      : await User.findByUsername(username);

    if (!targetUser) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'FRIEND_USER_NOT_FOUND'
        }
      });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({
        error: {
          message: 'You cannot friend yourself',
          code: 'CANNOT_FRIEND_SELF'
        }
      });
    }

    // Sending is allowed even if the receiver is full; acceptance checks both sides.
    const currentFriendsCount = await Friendship.countAccepted(req.user.id);
    if (currentFriendsCount >= MAX_FRIENDS) {
      return res.status(400).json({
        error: {
          message: 'You have reached the maximum of 4 friends.',
          code: 'FRIEND_LIMIT_REACHED'
        }
      });
    }

    // Check if relationship already exists
    const existing = await Friendship.findRequest(req.user.id, targetUser.id);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(200).json({
          status: 'success',
          data: { friendship: existing, alreadyFriends: true }
        });
      }

      if (existing.friend_user_id === req.user.id) {
        const acceptResult = await Friendship.acceptWithFriendLimit(existing.id, req.user.id, MAX_FRIENDS);
        if (acceptResult.status === 'friend_limit') {
          return res.status(400).json({
            error: {
              message: 'Both users need space for another friend before accepting.',
              code: 'FRIEND_LIMIT_REACHED'
            }
          });
        }

        if (acceptResult.status === 'not_found') {
          return res.status(404).json({
            error: {
              message: 'Friend request not found or not for you',
              code: 'FRIENDSHIP_UNAVAILABLE'
            }
          });
        }

        await notifyFriendshipAccepted(acceptResult.friendship, 'friend.request.auto_accepted');

        return res.status(200).json({
          status: 'success',
          data: { friendship: acceptResult.friendship, autoAccepted: true }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { request: existing, alreadySent: true }
      });
    }

    const request = await Friendship.create(req.user.id, targetUser.id);

    presenceManager.sendFriendListChangedToUsers([req.user.id, targetUser.id], {
      action: 'friend.request.received',
      friendshipId: request.id,
      senderId: req.user.id,
      senderUsername: req.user.username,
      receiverId: targetUser.id,
      receiverUsername: targetUser.username
    });

    res.status(201).json({
      status: 'success',
      data: { request }
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const acceptResult = await Friendship.acceptWithFriendLimit(id, req.user.id, MAX_FRIENDS);
    if (acceptResult.status === 'friend_limit') {
      return res.status(400).json({
        error: {
          message: 'Both users need space for another friend before accepting.',
          code: 'FRIEND_LIMIT_REACHED'
        }
      });
    }

    if (acceptResult.status === 'not_found') {
      return res.status(404).json({
        error: {
          message: 'Friend request not found or not for you',
          code: 'FRIENDSHIP_UNAVAILABLE'
        }
      });
    }

    await notifyFriendshipAccepted(acceptResult.friendship);

    res.status(200).json({
      status: 'success',
      data: { friendship: acceptResult.friendship }
    });
  } catch (err) {
    next(err);
  }
};

exports.removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Friendship.remove(id, req.user.id);
    
    if (!result) {
      return res.status(404).json({
        error: {
          message: 'Friendship not found',
          code: 'FRIENDSHIP_UNAVAILABLE'
        }
      });
    }

    await presenceManager.refreshUsersFriends([result.user_id, result.friend_user_id]);
    presenceManager.sendFriendListChangedToUsers([result.user_id, result.friend_user_id], {
      action: result.status === 'pending' ? 'friend.request.removed' : 'friend.removed',
      friendshipId: result.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

exports.getFriendDomain = async (req, res, next) => {
  try {
    const { friendUserId } = req.params;

    // Verify friendship
    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only view domains of accepted friends.' } });
    }

    const slimes = await Slime.findAllByUser(friendUserId);
    const friendInfo = await User.findById(friendUserId);

    res.status(200).json({
      status: 'success',
      data: {
        user: friendInfo,
        slimes
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.feedFriendSlime = async (req, res, next) => {
  try {
    const { friendUserId, slimeId } = req.params;

    // Verify friendship
    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only feed slimes of accepted friends.' } });
    }

    const slime = await Slime.findById(slimeId);
    if (!slime || slime.user_id !== friendUserId) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    if (slime.level >= 3) {
      return res.status(400).json({ error: { message: 'Slime is already an adult' } });
    }

    // Check cooldown (6 hours)
    if (slime.last_fed_at) {
      const lastFed = new Date(slime.last_fed_at);
      const now = new Date();
      if ((now - lastFed) / (1000 * 60 * 60) < 6) {
        return res.status(400).json({ error: { message: 'Slime is not hungry yet' } });
      }
    }

    // Deduct food from SENDER's factory
    const myFactory = await FoodFactory.findByUserId(req.user.id);
    if (!myFactory || myFactory.quantity <= 0) {
      return res.status(400).json({ error: { message: 'You have no food left to share' } });
    }

    await db.query('BEGIN');
    try {
      const updatedFactory = await FoodFactory.updateStock(req.user.id, -1);
      const updatedSlime = await Slime.update(slimeId, {
        level: slime.level + 1,
        last_fed_at: new Date()
      });
      
      const interaction = await Interaction.log({
        senderId: req.user.id,
        targetSlimeId: slimeId,
        actionType: 'feed'
      });

      await db.query('COMMIT');

      presenceManager.broadcastToFriends(friendUserId, {
        type: 'domain.slime.updated',
        payload: {
          slime: updatedSlime,
          userId: friendUserId
        }
      });

      // Emit WebSocket event to friendUserId
      presenceManager.sendToUser(friendUserId, {
        type: 'domain.slime.updated',
        payload: {
          slime: updatedSlime,
          slimeId,
          senderId: req.user.id,
          senderUsername: req.user.username,
          userId: friendUserId,
          newLevel: updatedSlime.level
        }
      });
      notifyInteractionCreated(friendUserId, {
        actionType: 'feed',
        interaction,
        senderId: req.user.id,
        senderUsername: req.user.username,
        slimeId
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

exports.pokeFriendSlime = async (req, res, next) => {
  try {
    const { friendUserId, slimeId } = req.params;

    // Verify friendship
    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only poke slimes of accepted friends.' } });
    }

    const slime = await Slime.findById(slimeId);
    if (!slime || slime.user_id !== friendUserId) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    const interaction = await Interaction.log({
      senderId: req.user.id,
      targetSlimeId: slimeId,
      actionType: 'poke'
    });

    notifyInteractionCreated(friendUserId, {
      actionType: 'poke',
      interaction,
      senderId: req.user.id,
      senderUsername: req.user.username,
      slimeId
    });

    res.status(200).json({
      status: 'success',
      data: { interaction },
      message: 'Poked!'
    });
  } catch (err) {
    next(err);
  }
};

function notifyInteractionCreated(ownerUserId, payload) {
  const event = {
    type: 'interaction.created',
    payload: {
      ...payload,
      ownerUserId
    }
  };

  presenceManager.sendToUser(ownerUserId, event);
  presenceManager.broadcastToFriends(ownerUserId, event);
}

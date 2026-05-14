const Friendship = require('../models/friendshipModel');
const User = require('../models/userModel');
const Slime = require('../models/slimeModel');
const FoodFactory = require('../models/foodFactoryModel');
const Interaction = require('../models/interactionModel');
const Notification = require('../models/notificationModel');
const presenceManager = require('../sockets/presenceManager');
const db = require('../config/db');

exports.listFriends = async (req, res, next) => {
  try {
    const friends = await Friendship.findFriends(req.user.id);
    const pending = await Friendship.findPendingRequests(req.user.id);
    const sent = await Friendship.findSentRequests(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: { 
        friends, 
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
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: { message: 'Username is required' } });
    }

    if (username === req.user.username) {
      return res.status(400).json({ error: { message: 'You cannot friend yourself' } });
    }

    const targetUser = await User.findByUsername(username);
    if (!targetUser) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Check friend limit (4)
    const currentFriendsCount = await Friendship.countAccepted(req.user.id);
    if (currentFriendsCount >= 4) {
      return res.status(400).json({ error: { message: 'You have reached the maximum of 4 friends.' } });
    }

    // Check if relationship already exists
    const existing = await Friendship.findRequest(req.user.id, targetUser.id);
    if (existing) {
      return res.status(400).json({ error: { message: 'Friend request already exists or you are already friends.' } });
    }

    const request = await Friendship.create(req.user.id, targetUser.id);

    // Create persistent notification for target user
    await Notification.create({
      userId: targetUser.id,
      type: 'FRIEND_REQUEST',
      content: {
        senderId: req.user.id,
        senderUsername: req.user.username,
        friendshipId: request.id
      }
    });

    res.status(201).json({
      status: 'success',
      data: { request }
    });
  } catch (err) {
    next(err);
  }
};

exports.searchUser = async (req, res, next) => {
  try {
    const username = String(req.query.username || '').trim();

    if (!username) {
      return res.status(400).json({ error: { message: 'Username is required' } });
    }

    const user = await User.findPublicByUsername(username);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user has space for more friends
    const currentFriendsCount = await Friendship.countAccepted(req.user.id);
    if (currentFriendsCount >= 4) {
      return res.status(400).json({ error: { message: 'You have reached the maximum of 4 friends.' } });
    }

    const result = await Friendship.accept(id, req.user.id);
    if (!result) {
      return res.status(404).json({ error: { message: 'Friend request not found or not for you' } });
    }

    res.status(200).json({
      status: 'success',
      data: { friendship: result }
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
      return res.status(404).json({ error: { message: 'Friendship not found' } });
    }

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
      await FoodFactory.updateStock(req.user.id, -1);
      const updatedSlime = await Slime.update(slimeId, {
        level: slime.level + 1,
        last_fed_at: new Date()
      });
      
      await Interaction.log({
        senderId: req.user.id,
        targetSlimeId: slimeId,
        actionType: 'feed'
      });

      await db.query('COMMIT');

      // Emit WebSocket event to friendUserId
      presenceManager.sendToUser(friendUserId, {
        type: 'SLIME_FED',
        payload: {
          slimeId,
          senderId: req.user.id,
          senderUsername: req.user.username,
          newLevel: updatedSlime.level
        }
      });
      
      res.status(200).json({
        status: 'success',
        data: { slime: updatedSlime }
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

    await Interaction.log({
      senderId: req.user.id,
      targetSlimeId: slimeId,
      actionType: 'poke'
    });

    // Emit WebSocket event to friendUserId
    presenceManager.sendToUser(friendUserId, {
      type: 'SLIME_POKED',
      payload: {
        slimeId,
        senderId: req.user.id,
        senderUsername: req.user.username
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Poked!'
    });
  } catch (err) {
    next(err);
  }
};

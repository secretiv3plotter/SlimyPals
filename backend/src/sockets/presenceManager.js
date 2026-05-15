const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Friendship = require('../models/friendshipModel');
require('dotenv').config();

// Store online users: userId -> { ws, username, friends: [] }
const onlineUsers = new Map();

const presenceManager = {
  async handleConnection(ws, token) {
    try {
      if (!token) throw new Error('No token provided');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) throw new Error('User not found');

      const userId = user.id;
      const friends = await Friendship.findFriends(userId);
      const friendIds = friends.map(f => f.friend_id);

      // Store user connection
      onlineUsers.set(userId, {
        ws,
        username: user.username,
        friendIds
      });

      console.log(`User connected: ${user.username} (${userId})`);

      // Notify friends that this user is online
      this.broadcastToFriends(userId, {
        type: 'friend.online',
        payload: { userId, username: user.username }
      });

      // Send initial presence list to the connected user
      const onlineFriendIds = friendIds.filter(id => onlineUsers.has(id));
      ws.send(JSON.stringify({
        type: 'presence.initial',
        payload: { onlineFriendIds }
      }));

      ws.on('close', () => {
        console.log(`User disconnected: ${user.username}`);
        onlineUsers.delete(userId);
        this.broadcastToFriends(userId, {
          type: 'friend.offline',
          payload: { userId }
        });
      });

      ws.on('error', (err) => {
        console.error(`WebSocket error for ${user.username}:`, err);
      });

    } catch (err) {
      console.error('WebSocket Auth Error:', err.message);
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized' }));
      ws.close();
    }
  },

  broadcastToFriends(userId, message) {
    const userData = onlineUsers.get(userId);
    if (!userData) return;

    userData.friendIds.forEach(friendId => {
      const friendConnection = onlineUsers.get(friendId);
      if (friendConnection && friendConnection.ws.readyState === 1) { // 1 = OPEN
        friendConnection.ws.send(JSON.stringify(message));
      }
    });
  },

  sendToUser(userId, message) {
    const userData = onlineUsers.get(userId);
    if (userData && userData.ws.readyState === 1) {
      userData.ws.send(JSON.stringify(message));
    }
  },

  isUserOnline(userId) {
    return onlineUsers.has(userId);
  },

  async refreshUserFriends(userId) {
    const userData = onlineUsers.get(userId);
    if (!userData) return;

    const friends = await Friendship.findFriends(userId);
    userData.friendIds = friends.map(f => f.friend_id);
  },

  async refreshUsersFriends(userIds) {
    await Promise.all(userIds.map(userId => this.refreshUserFriends(userId)));
  },

  sendFriendListChanged(userId, payload = {}) {
    this.sendToUser(userId, {
      type: 'friend.list.changed',
      payload
    });
  },

  sendFriendListChangedToUsers(userIds, payload = {}) {
    userIds.forEach(userId => this.sendFriendListChanged(userId, payload));
  }
};

module.exports = presenceManager;

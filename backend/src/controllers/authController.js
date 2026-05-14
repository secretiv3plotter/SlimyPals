const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const db = require('../config/db');
require('dotenv').config();

const signAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const createAuthSession = async (user) => {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username
    }
  };
};

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: { message: 'Username and password are required' } });
    }

    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: { message: 'Username already taken' } });
    }

    const user = await User.create({ username, password });
    const authSession = await createAuthSession(user);

    res.status(201).json({
      status: 'success',
      data: authSession
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: { message: 'Username and password are required' } });
    }

    const user = await User.findByUsername(username);
    if (!user || !(await User.comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: { message: 'Invalid username or password' } });
    }

    const authSession = await createAuthSession(user);

    res.status(200).json({
      status: 'success',
      data: authSession
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: { message: 'Refresh token is required' } });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: { message: 'Invalid refresh token' } });
    }

    // Check if token exists in DB
    const result = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'Refresh token expired or invalid' } });
    }

    const userId = decoded.id;
    const newAccessToken = signAccessToken(userId);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

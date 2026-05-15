const User = require('../models/userModel');

exports.searchByUsername = async (req, res, next) => {
  try {
    const username = (req.query.username || '').trim();

    if (!username) {
      return res.status(400).json({
        error: {
          message: 'Username is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const user = await User.findPublicByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'FRIEND_USER_NOT_FOUND'
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

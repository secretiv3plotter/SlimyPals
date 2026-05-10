const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: { message: 'Not authorized to access this route', code: 'UNAUTHORIZED' }
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({
          error: { message: 'The user belonging to this token no longer exists', code: 'USER_NOT_FOUND' }
        });
      }

      req.user = currentUser;
      next();
    } catch (err) {
      return res.status(401).json({
        error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' }
      });
    }
  } catch (err) {
    next(err);
  }
};

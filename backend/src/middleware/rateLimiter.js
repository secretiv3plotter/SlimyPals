const rateLimit = require('express-rate-limit');

// General API Limiter (already applied globally but can be used specifically)
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 mins
  message: {
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes',
      code: 'TOO_MANY_REQUESTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Limiter for Auth (Login/Register)
exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 register/login requests per hour
  message: {
    error: {
      message: 'Too many authentication attempts, please try again after an hour',
      code: 'AUTH_THROTTLED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Game Action Limiter (Summoning, Feeding, etc.)
exports.gameActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 game actions per minute
  message: {
    error: {
      message: 'Take it slow! You are clicking too fast.',
      code: 'ACTION_THROTTLED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const express = require('express');
const domainController = require('../controllers/domainController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.get('/me', domainController.getCurrentUser);
router.get('/me/domain', domainController.getMyDomain);
router.get('/me/timers', domainController.getTimers);

module.exports = router;

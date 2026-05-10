const express = require('express');
const slimeController = require('../controllers/slimeController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All slime routes are protected and rate-limited
router.use(protect);
router.use(gameActionLimiter);

router.get('/me/slimes', slimeController.listMySlimes);
router.post('/me/slimes/summon', slimeController.summonSlime);
router.post('/me/slimes/:id/feed', slimeController.feedSlime);
router.delete('/me/slimes/:id', slimeController.deleteSlime);

module.exports = router;

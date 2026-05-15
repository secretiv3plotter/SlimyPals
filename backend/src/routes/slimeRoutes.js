const express = require('express');
const slimeController = require('../controllers/slimeController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/slimes', slimeController.listMySlimes);
router.post('/me/slimes/summon', gameActionLimiter, slimeController.summonSlime);
router.post('/me/slimes/:id/feed', gameActionLimiter, slimeController.feedSlime);
router.delete('/me/slimes/:id', gameActionLimiter, slimeController.deleteSlime);

module.exports = router;

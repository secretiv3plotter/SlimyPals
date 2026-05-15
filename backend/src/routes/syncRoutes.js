const express = require('express');
const syncController = require('../controllers/syncController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.post('/sync/actions', syncController.syncActions);

module.exports = router;

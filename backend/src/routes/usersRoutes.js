const express = require('express');
const usersController = require('../controllers/usersController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.get('/users/search', usersController.searchByUsername);

module.exports = router;

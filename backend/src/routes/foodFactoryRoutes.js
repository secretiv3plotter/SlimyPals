const express = require('express');
const foodFactoryController = require('../controllers/foodFactoryController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/food-factory', foodFactoryController.getFoodFactory);
router.post('/me/food-factory/produce', gameActionLimiter, foodFactoryController.produceFood);

module.exports = router;

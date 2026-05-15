const express = require('express');
const domainController = require('../controllers/domainController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', domainController.getCurrentUser);
router.get('/me/domain', domainController.getMyDomain);
router.get('/me/timers', domainController.getTimers);

module.exports = router;

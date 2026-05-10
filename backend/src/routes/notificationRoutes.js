const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me/notifications', notificationController.listNotifications);
router.post('/me/notifications/:id/read', notificationController.markRead);

module.exports = router;

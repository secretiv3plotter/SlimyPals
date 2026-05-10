const express = require('express');
const friendsController = require('../controllers/friendsController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.get('/me/friends', friendsController.listFriends);
router.post('/me/friends', friendsController.sendFriendRequest);
router.post('/me/friends/:id/accept', friendsController.acceptFriendRequest);
router.delete('/me/friends/:id', friendsController.removeFriend);

router.get('/friends/:friendUserId/domain', friendsController.getFriendDomain);
router.post('/friends/:friendUserId/slimes/:slimeId/feed', friendsController.feedFriendSlime);
router.post('/friends/:friendUserId/slimes/:slimeId/poke', friendsController.pokeFriendSlime);

module.exports = router;

const express = require('express');
const friendsController = require('../controllers/friendsController');
const { protect } = require('../middleware/authMiddleware');
const { gameActionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/friends', friendsController.listFriends);
router.post('/me/friends', gameActionLimiter, friendsController.sendFriendRequest);
router.post('/me/friends/:id/accept', gameActionLimiter, friendsController.acceptFriendRequest);
router.delete('/me/friends/:id', gameActionLimiter, friendsController.removeFriend);

router.get('/friends/:friendUserId/domain', friendsController.getFriendDomain);
router.post('/friends/:friendUserId/slimes/:slimeId/feed', gameActionLimiter, friendsController.feedFriendSlime);
router.post('/friends/:friendUserId/slimes/:slimeId/poke', gameActionLimiter, friendsController.pokeFriendSlime);

module.exports = router;

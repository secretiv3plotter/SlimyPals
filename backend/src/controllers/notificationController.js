const Notification = require('../models/notificationModel');

exports.listNotifications = async (req, res, next) => {
  try {
    const limit = req.query.limit || 20;
    const notifications = await Notification.findAllByUser(req.user.id, limit);
    
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Notification.markAsRead(id, req.user.id);
    
    if (!result) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    res.status(200).json({
      status: 'success',
      data: { notification: result }
    });
  } catch (err) {
    next(err);
  }
};

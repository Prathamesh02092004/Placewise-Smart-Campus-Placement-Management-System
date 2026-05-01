const router = require('express').Router();
const Joi = require('joi');
const notificationService = require('../services/notification.service');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validate } = require('../middleware/validate.middleware');
const { success, paginated } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

router.get('/',
  authenticate, authLimiter,
  async (req, res, next) => {
    try {
      const pagination = getPaginationParams(req.query);
      const { rows, pagination: meta } = await notificationService.getUserNotifications(
        req.user.userId, pagination
      );
      return paginated(res, rows, meta, 'Notifications retrieved.');
    } catch (err) { next(err); }
  }
);

router.get('/unread-count',
  authenticate, authLimiter,
  async (req, res, next) => {
    try {
      const count = await notificationService.getUnreadCount(req.user.userId);
      return success(res, 200, 'Unread count retrieved.', { count });
    } catch (err) { next(err); }
  }
);

router.patch('/:id/read',
  authenticate, authLimiter,
  validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }),
  async (req, res, next) => {
    try {
      await notificationService.markRead(req.params.id, req.user.userId);
      return success(res, 200, 'Notification marked as read.');
    } catch (err) { next(err); }
  }
);

router.patch('/mark-all-read',
  authenticate, authLimiter,
  async (req, res, next) => {
    try {
      await notificationService.markAllRead(req.user.userId);
      return success(res, 200, 'All notifications marked as read.');
    } catch (err) { next(err); }
  }
);

module.exports = router;
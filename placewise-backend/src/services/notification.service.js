const { v4: uuidv4 } = require('uuid');
const { Notification } = require('../models');
const { emitNotification } = require('../sockets/notification.socket');
const logger = require('../utils/logger');


const createAndEmit = async (userId, { type, title, message, metadata = {} }) => {
  try {
    const notification = await Notification.create({
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      message,
      metadata,
    });

    // Emit real-time event
    emitNotification(userId, notification);

    return notification;
  } catch (err) {
    logger.error('Notification createAndEmit failed:', err.message);
    // Never throw — notification failure must not break the main flow
  }
};

const getUserNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const { paginate } = require('../utils/paginate');
  return paginate(Notification, {
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  }, { page, limit });
};


const markRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });
  if (!notification) return null;
  await notification.update({ read: true });
  return notification;
};


const markAllRead = async (userId) => {
  await Notification.update({ read: true }, { where: { user_id: userId, read: false } });
};


const getUnreadCount = async (userId) => {
  return Notification.count({ where: { user_id: userId, read: false } });
};

module.exports = { createAndEmit, getUserNotifications, markRead, markAllRead, getUnreadCount };
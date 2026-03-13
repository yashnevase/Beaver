const db = require('../../../models');
const { emitToUser } = require('../../../config/socket');
const emailService = require('../../../lib/email');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams } = require('../../../utils/pagination');
const logger = require('../../../config/logger');

const createNotification = async ({ user_id, type, title, message, metadata = {}, sendEmail = false }) => {
  const notification = await db.Notification.create({
    user_id,
    type,
    title,
    message,
    metadata,
    sent_via: sendEmail ? 'both' : 'inapp'
  });

  emitToUser(user_id, 'notification:new', notification);

  if (sendEmail) {
    const user = await db.User.findByPk(user_id);
    if (user) {
      try {
        await emailService.sendNotificationEmail(user, title, message);
      } catch (error) {
        logger.error(`Failed to send notification email to user ${user_id}:`, error);
      }
    }
  }

  return notification;
};

const listNotifications = async (user, query) => {
  const { page, limit, offset } = getPaginationParams(query);
  const result = await db.Notification.findAndCountAll({
    where: { user_id: user.user_id },
    order: [['created_at', 'DESC']],
    offset,
    limit
  });

  return {
    data: result.rows,
    pagination: {
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
      hasNext: page * limit < result.count,
      hasPrev: page > 1
    }
  };
};

const markAsRead = async (notificationId, user) => {
  const notification = await db.Notification.findByPk(notificationId);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.user_id !== user.user_id) {
    throw ApiError.forbidden('You can only update your own notifications');
  }

  await notification.update({ read_at: new Date() });
  return notification;
};

const markAllAsRead = async (user) => {
  const [updatedCount] = await db.Notification.update(
    { read_at: new Date() },
    {
      where: {
        user_id: user.user_id,
        read_at: null
      }
    }
  );

  return { updatedCount };
};

module.exports = {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead
};

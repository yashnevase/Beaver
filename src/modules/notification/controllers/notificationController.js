const notificationService = require('../services/notificationService');
const ApiResponse = require('../../../utils/ApiResponse');

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user, req.query);
    return ApiResponse.success(res, result, 'Notifications fetched successfully');
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user);
    return ApiResponse.success(res, result, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead
};

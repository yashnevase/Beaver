const dashboardService = require('../services/dashboardService');
const ApiResponse = require('../../../utils/ApiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboard(req.user);
    return ApiResponse.success(res, result, 'Dashboard fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const result = await dashboardService.getAnalytics(req.user);
    return ApiResponse.success(res, result, 'Analytics fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAnalytics
};

const inviteService = require('../services/inviteService');
const ApiResponse = require('../../../utils/ApiResponse');

const createInvite = async (req, res, next) => {
  try {
    const result = await inviteService.createInvite(req.body, req.user);
    return ApiResponse.created(res, result, 'Invite created successfully');
  } catch (error) {
    next(error);
  }
};

const getInviteByToken = async (req, res, next) => {
  try {
    const result = await inviteService.getInviteByToken(req.params.token);
    return ApiResponse.success(res, result, 'Invite fetched successfully');
  } catch (error) {
    next(error);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const result = await inviteService.acceptInvite(req.params.token, req.user);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvite,
  getInviteByToken,
  acceptInvite
};

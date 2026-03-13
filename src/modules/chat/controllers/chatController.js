const chatService = require('../services/chatService');
const ApiResponse = require('../../../utils/ApiResponse');
const { getFileUrl } = require('../../../utils/fileUpload');
const { ApiError } = require('../../../middleware/errorHandler');

const listMessages = async (req, res, next) => {
  try {
    const result = await chatService.listMessages(req.params.agreementId, req.user, req.query);
    return ApiResponse.success(res, result, 'Chat messages fetched successfully');
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const result = await chatService.sendMessage(req.params.agreementId, req.body, req.user);
    return ApiResponse.created(res, result, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
};

const sendImageMessage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(ApiError.badRequest('Image file is required'));
    }

    const relativePath = req.file.path.replace(/\\/g, '/');
    const result = await chatService.sendMessage(
      req.params.agreementId,
      {
        message: req.body.message || null,
        image_url: getFileUrl(relativePath)
      },
      req.user
    );

    return ApiResponse.created(res, result, 'Image message sent successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listMessages,
  sendMessage,
  sendImageMessage
};

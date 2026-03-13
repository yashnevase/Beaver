const paymentService = require('../services/paymentService');
const ApiResponse = require('../../../utils/ApiResponse');

const initiatePayment = async (req, res, next) => {
  try {
    const result = await paymentService.initiatePayment(req.body, req.user);
    return ApiResponse.created(res, result, 'Payment initiated successfully');
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(req.body, req.user);
    return ApiResponse.success(res, result, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const result = await paymentService.handleWebhook({
      event: req.body.event,
      payload: req.body.payload,
      rawBody: req.rawBody,
      signature: req.headers['x-razorpay-signature']
    });
    return ApiResponse.success(res, result, 'Webhook processed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook
};

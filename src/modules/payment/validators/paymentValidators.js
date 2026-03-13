const Joi = require('joi');

const initiatePaymentSchema = Joi.object({
  agreement_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('rent', 'deposit', 'expense', 'refund').default('rent')
});

const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
});

module.exports = {
  initiatePaymentSchema,
  verifyPaymentSchema
};

const Joi = require('joi');

const transactionListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('created_at', 'due_date', 'paid_at', 'amount', 'status', 'type').default('created_at'),
  order: Joi.string().valid('ASC', 'DESC').default('DESC'),
  status: Joi.string().valid('pending', 'completed', 'failed', 'refunded'),
  type: Joi.string().valid('rent', 'deposit', 'expense', 'refund')
});

const transactionIdParamsSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  transactionListQuerySchema,
  transactionIdParamsSchema
};

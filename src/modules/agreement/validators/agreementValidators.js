const Joi = require('joi');

const createAgreementSchema = Joi.object({
  property_id: Joi.number().integer().positive().required(),
  tenant_id: Joi.number().integer().positive().required(),
  invite_id: Joi.number().integer().positive().optional(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().greater(Joi.ref('start_date')).required(),
  rent_amount: Joi.number().min(0).required(),
  deposit_amount: Joi.number().min(0).default(0),
  rent_due_day: Joi.number().integer().min(1).max(28).default(1),
  gst_rate: Joi.number().min(0).max(100).default(0),
  terms: Joi.object().default({})
});

const updateAgreementSchema = createAgreementSchema.fork(['property_id', 'tenant_id', 'start_date', 'end_date', 'rent_amount'], (schema) => schema.optional());

const revokeAgreementSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null)
});

const renewAgreementSchema = Joi.object({
  end_date: Joi.date().iso().required(),
  rent_amount: Joi.number().min(0).optional(),
  deposit_amount: Joi.number().min(0).optional()
});

const rejectAgreementSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null)
});

const settleAgreementSchema = Joi.object({
  refund_amount: Joi.number().min(0).required(),
  deduction_amount: Joi.number().min(0).required(),
  deduction_reason: Joi.string().max(1000).allow('', null).optional(),
  closed_reason: Joi.string().max(1000).allow('', null).optional()
});

module.exports = {
  createAgreementSchema,
  updateAgreementSchema,
  revokeAgreementSchema,
  renewAgreementSchema,
  rejectAgreementSchema,
  settleAgreementSchema
};

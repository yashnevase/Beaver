const Joi = require('joi');

const createInviteSchema = Joi.object({
  property_id: Joi.number().integer().positive().required(),
  email: Joi.string().email().required()
});

module.exports = {
  createInviteSchema
};

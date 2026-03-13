const Joi = require('joi');

const propertySchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid('house', 'flat', 'shop', 'land').required(),
  address_line: Joi.string().min(5).max(500).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
  rent_amount: Joi.number().min(0).required(),
  deposit_amount: Joi.number().min(0).default(0),
  description: Joi.string().allow('', null),
  photos: Joi.array().items(Joi.string().uri()).default([])
});

const updatePropertySchema = propertySchema.fork(
  ['name', 'type', 'address_line', 'city', 'state', 'pincode', 'rent_amount'],
  (schema) => schema.optional()
);

module.exports = {
  propertySchema,
  updatePropertySchema
};

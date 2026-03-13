const Joi = require('joi');

const updateMyProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
  address_line: Joi.string().max(255).allow('', null).optional(),
  city: Joi.string().max(100).allow('', null).optional(),
  state: Joi.string().max(100).allow('', null).optional(),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Pincode must be 6 digits'
  }),
  bank_account_number: Joi.string().max(50).allow('', null).optional(),
  bank_ifsc: Joi.string().uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Invalid IFSC format'
  }),
  bank_name: Joi.string().max(200).allow('', null).optional(),
  date_of_birth: Joi.date().less('now').allow(null).optional(),
  gender: Joi.string().valid('male', 'female', 'other').allow(null).optional()
});

const uploadDocumentSchema = Joi.object({
  doc_type: Joi.string().valid('aadhaar', 'pan', 'address_proof').required(),
  doc_number: Joi.string().max(100).allow('', null).optional()
});

module.exports = {
  updateMyProfileSchema,
  uploadDocumentSchema
};

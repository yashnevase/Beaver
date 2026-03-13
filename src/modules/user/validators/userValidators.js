const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  full_name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('owner', 'tenant', 'admin').optional()
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  role: Joi.string().valid('owner', 'tenant', 'admin').optional(),
  is_active: Joi.boolean().optional(),
  email_verified: Joi.boolean().optional(),
  profile_photo: Joi.string().uri().optional()
});

const scheduleDeactivationSchema = Joi.object({
  deactivation_date: Joi.date().iso().required().messages({
    'date.base': 'Deactivation date must be a valid date',
    'any.required': 'Deactivation date is required'
  })
});

const assignRoleSchema = Joi.object({
  role_name: Joi.string().required().messages({
    'any.required': 'Role name is required'
  })
});

const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  scheduleDeactivationSchema,
  assignRoleSchema,
  userIdSchema
};

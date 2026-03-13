const Joi = require('joi');

const sendMessageSchema = Joi.object({
  message: Joi.string().allow('', null),
  image_url: Joi.string().uri().allow('', null)
}).or('message', 'image_url');

module.exports = {
  sendMessageSchema
};

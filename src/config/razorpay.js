const Razorpay = require('razorpay');
const logger = require('./logger');

let instance = null;

const getRazorpayInstance = () => {
  if (!instance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      logger.warn('Razorpay credentials not configured. Payment features will not work.');
      return null;
    }
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    logger.info('Razorpay instance initialized');
  }
  return instance;
};

module.exports = { getRazorpayInstance };

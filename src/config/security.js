const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getBcryptRounds = () => parseInt(process.env.BCRYPT_ROUNDS) || 12;

const sanitizeValue = (val) => {
  if (typeof val === 'string') {
    val = val.replace(/<\/?script[^>]*>/gi, '');
    val = val.replace(/[\u0000-\u001F\u007F]/g, '');
  }
  return val;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    
    const value = obj[key];
    if (Array.isArray(value)) {
      obj[key] = value.map(item => 
        typeof item === 'object' ? sanitizeObject(item) : sanitizeValue(item)
      );
    } else if (value && typeof value === 'object') {
      obj[key] = sanitizeObject(value);
    } else {
      obj[key] = sanitizeValue(value);
    }
  }
  return obj;
};

const xssProtection = (req, res, next) => {
  if (process.env.ENABLE_SECURITY_MW !== 'false') {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
  }
  next();
};

const buildHelmetConfig = (nonce) => helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.ENABLE_CSP === 'true' ? {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://*.razorpay.com",
        nonce ? `'nonce-${nonce}'` : null
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://*.razorpay.com"
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:", "https://*.razorpay.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https://*.razorpay.com"],
      frameSrc: ["'self'", "https://*.razorpay.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  } : false
});

module.exports = {
  generateToken,
  verifyToken,
  getBcryptRounds,
  xssProtection,
  buildHelmetConfig,
  sanitizeObject,
  sanitizeValue
};

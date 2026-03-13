const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../config/logger');
const { xssProtection, buildHelmetConfig } = require('../config/security');
const { ENABLE_RATE_LIMIT, apiRateLimiter } = require('../config/rateLimiters');

const getAllowedOrigins = () => {
  const origins = [];
  
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
  }
  
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080');
  }
  
  return [...new Set(origins)];
};

const initMiddleware = (app) => {
  app.use(cookieParser());
  
  app.use(compression());
  
  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  });
  
  if (process.env.ENABLE_CSP !== 'false') {
    app.use((req, res, next) => {
      buildHelmetConfig(res.locals.cspNonce)(req, res, next);
    });
  }
  
  if (process.env.ENABLE_CORS !== 'false') {
    const allowedOrigins = getAllowedOrigins();
    
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'production') {
          if (!allowedOrigins.includes(origin)) {
            logger.warn(`CORS blocked: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
          }
        }
        
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN', 'X-Correlation-ID'],
      exposedHeaders: ['X-CSRF-TOKEN', 'X-Correlation-ID', 'X-Response-Time']
    }));
  }
  
  app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-ID', req.correlationId);
    
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const level = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
      logger[level](`[${req.correlationId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      
      if (duration > 1000) {
        logger.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
    });
    
    // Set response time header before sending response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${duration}ms`);
      return originalSend.call(this, data);
    };
    
    next();
  });
  
  app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  if (process.env.ENABLE_SECURITY_MW !== 'false') {
    app.use(xssProtection);
  }
  
  if (ENABLE_RATE_LIMIT) {
    app.use((req, res, next) => {
      if (req.path === '/health' || req.path.startsWith('/uploads')) {
        return next();
      }
      return apiRateLimiter(req, res, next);
    });
  }
  
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    if (req.path.includes('/api')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    next();
  });
};

module.exports = { initMiddleware };

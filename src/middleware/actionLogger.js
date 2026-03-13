const db = require('../models');
const logger = require('../config/logger');

const actionLogger = async (req, res, next) => {
  if (process.env.ENABLE_ACTION_LOGGING === 'false') {
    return next();
  }

  const startTime = Date.now();
  
  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody;
  let responseStatus;

  res.send = function(data) {
    responseBody = data;
    responseStatus = res.statusCode;
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    responseBody = data;
    responseStatus = res.statusCode;
    return originalJson.call(this, data);
  };

  res.on('finish', async () => {
    try {
      const executionTime = Date.now() - startTime;
      
      const sanitizeBody = (body) => {
        if (!body) return null;
        const sanitized = { ...body };
        if (sanitized.password) sanitized.password = '[REDACTED]';
        if (sanitized.current_password) sanitized.current_password = '[REDACTED]';
        if (sanitized.new_password) sanitized.new_password = '[REDACTED]';
        if (sanitized.otp) sanitized.otp = '[REDACTED]';
        return sanitized;
      };

      const pathParts = req.path.split('/').filter(Boolean);
      const module = pathParts[1] || 'general';
      
      let actionType = `${req.method}_${module}`;
      if (pathParts[2]) {
        actionType = `${req.method}_${pathParts[2]}`;
      }

      const logData = {
        user_id: req.user ? req.user.user_id : null,
        action_type: actionType.toUpperCase(),
        module: module,
        entity_type: pathParts[2] || null,
        entity_id: req.params.id ? parseInt(req.params.id) : null,
        request_method: req.method,
        request_path: req.path,
        request_body: sanitizeBody(req.body),
        request_query: Object.keys(req.query).length > 0 ? req.query : null,
        response_status: responseStatus,
        response_message: typeof responseBody === 'string' ? responseBody.substring(0, 500) : null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        execution_time_ms: executionTime,
        error_message: res.statusCode >= 400 && typeof responseBody === 'string' ? responseBody : null
      };

      await db.ActionLog.create(logData);

      if (process.env.ENABLE_DETAILED_LOGGING === 'true') {
        logger.info('Action logged:', {
          user: req.user ? req.user.email : 'anonymous',
          method: req.method,
          path: req.path,
          status: responseStatus,
          duration: executionTime + 'ms'
        });
      }
    } catch (error) {
      logger.error('Error logging action:', error);
    }
  });

  next();
};

module.exports = actionLogger;

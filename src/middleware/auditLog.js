const logger = require('../config/logger');

const auditLog = (action, options = {}) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const { logBody = false, logResponse = false } = options;
    
    res.send = function(data) {
      setImmediate(async () => {
        try {
          const auditData = {
            action,
            actor_id: req.user?.user_id || req.user?.id,
            actor_type: req.user?.role || 'ANONYMOUS',
            resource: req.originalUrl,
            method: req.method,
            status_code: res.statusCode,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            correlation_id: req.correlationId,
            timestamp: new Date().toISOString()
          };
          
          if (logBody && req.body) {
            const sanitizedBody = { ...req.body };
            if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
            if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
            auditData.request_body = JSON.stringify(sanitizedBody);
          }
          
          if (logResponse && res.statusCode >= 400) {
            auditData.response_body = data;
          }
          
          logger.info('AUDIT_LOG', auditData);
          
        } catch (error) {
          logger.error('Audit log failed:', error);
        }
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { auditLog };

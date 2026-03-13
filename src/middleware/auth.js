const { tokenService } = require('../lib/auth');
const { ApiError } = require('./errorHandler');
const logger = require('../config/logger');
const db = require('../models');
const { getRolePermissions } = require('../constants/roles');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      throw ApiError.unauthorized('No token provided');
    }
    
    const payload = tokenService.verifyAccessToken(token);
    if (!payload) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
    
    const user = await db.User.findByPk(payload.user_id);
    if (!user || !user.is_active || user.deleted_at) {
      throw ApiError.unauthorized('User not found or inactive');
    }
    
    const permissions = getRolePermissions(user.role);
    
    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      permissions
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (token) {
      const payload = tokenService.verifyAccessToken(token);
      if (payload) {
        const user = await db.User.findByPk(payload.user_id);
        if (user && user.is_active) {
          req.user = {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            tier: user.tier,
            permissions: getRolePermissions(user.role)
          };
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }
      
      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(permission)) {
        logger.warn(`Permission denied: ${permission} for user ${req.user.user_id}`);
        throw ApiError.forbidden(`Permission denied: ${permission}`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireAnyPermission = (permissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }
      
      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.some(p => userPermissions.includes(p));
      
      if (!hasPermission) {
        logger.warn(`Permission denied: requires any of [${permissions.join(', ')}] for user ${req.user.user_id}`);
        throw ApiError.forbidden('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }
      
      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Role denied: requires [${allowedRoles.join(', ')}], user has ${userRole}`);
        throw ApiError.forbidden('Insufficient role');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireTier = (tiers = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }
      
      const allowedTiers = Array.isArray(tiers) ? tiers : [tiers];
      
      if (!allowedTiers.includes(req.user.tier)) {
        throw ApiError.forbidden('Upgrade your plan to access this feature');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireTier
};

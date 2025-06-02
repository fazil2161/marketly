const { createError } = require('./error');

// Ensure user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required', 'NO_USER');
  }

  if (req.user.role !== 'admin') {
    throw createError.forbidden(
      'Admin access required',
      'ADMIN_ACCESS_REQUIRED'
    );
  }

  next();
};

// Check if user has admin privileges or owns the resource
const isAdminOrOwner = (getUserIdFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      throw createError.unauthorized('Authentication required', 'NO_USER');
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    let resourceUserId;
    
    if (typeof getUserIdFromRequest === 'function') {
      resourceUserId = getUserIdFromRequest(req);
    } else if (typeof getUserIdFromRequest === 'string') {
      // Extract from request params, body, or query
      resourceUserId = req.params[getUserIdFromRequest] || 
                      req.body[getUserIdFromRequest] || 
                      req.query[getUserIdFromRequest];
    } else {
      // Default to userId parameter
      resourceUserId = req.params.userId || req.body.userId;
    }

    if (!resourceUserId) {
      throw createError.badRequest('Resource user ID not found', 'MISSING_USER_ID');
    }

    // Check if user owns the resource
    if (req.user._id.toString() !== resourceUserId.toString()) {
      throw createError.forbidden(
        'Access denied - admin privileges or resource ownership required',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

// Log admin actions for audit trail
const logAdminAction = (action) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      const logData = {
        admin: req.user._id,
        adminEmail: req.user.email,
        action: action,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query
      };

      // In a production app, you'd want to store this in a database
      console.log('Admin Action Log:', JSON.stringify(logData, null, 2));
      
      // Store in request for potential use in controllers
      req.adminActionLog = logData;
    }
    
    next();
  };
};

// Validate admin permissions for specific operations
const validateAdminOperation = (operation) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      throw createError.forbidden('Admin access required', 'ADMIN_ACCESS_REQUIRED');
    }

    // Define admin operation permissions
    const adminPermissions = {
      // User management
      'view_users': true,
      'edit_users': true,
      'delete_users': true,
      'change_user_roles': true,
      
      // Product management
      'create_products': true,
      'edit_products': true,
      'delete_products': true,
      'manage_inventory': true,
      
      // Order management
      'view_all_orders': true,
      'edit_orders': true,
      'cancel_orders': true,
      'process_refunds': true,
      
      // System settings
      'manage_settings': true,
      'view_analytics': true,
      'manage_categories': true,
      
      // Review management
      'moderate_reviews': true,
      'delete_reviews': true
    };

    if (!adminPermissions[operation]) {
      throw createError.forbidden(
        `Operation '${operation}' not permitted`,
        'OPERATION_NOT_PERMITTED'
      );
    }

    next();
  };
};

// Ensure admin account is properly configured
const validateAdminAccount = (req, res, next) => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required', 'NO_USER');
  }

  if (req.user.role !== 'admin') {
    throw createError.forbidden('Admin access required', 'ADMIN_ACCESS_REQUIRED');
  }

  // Check if admin account is properly set up
  if (!req.user.isEmailVerified) {
    throw createError.forbidden(
      'Admin account email must be verified',
      'ADMIN_EMAIL_NOT_VERIFIED'
    );
  }

  if (!req.user.isActive) {
    throw createError.forbidden(
      'Admin account is deactivated',
      'ADMIN_ACCOUNT_DEACTIVATED'
    );
  }

  next();
};

// Rate limiting specifically for admin actions
const adminRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return next();
    }

    const key = `admin_${req.user._id}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requestCounts.has(key)) {
      const requests = requestCounts.get(key).filter(time => time > windowStart);
      requestCounts.set(key, requests);
    }

    const currentRequests = requestCounts.get(key) || [];
    
    if (currentRequests.length >= maxRequests) {
      throw createError.tooManyRequests(
        'Too many admin requests, please slow down',
        'ADMIN_RATE_LIMIT_EXCEEDED'
      );
    }

    currentRequests.push(now);
    requestCounts.set(key, currentRequests);
    
    next();
  };
};

// Prevent admin from performing actions on their own account (for certain operations)
const preventSelfAction = (req, res, next) => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required', 'NO_USER');
  }

  const targetUserId = req.params.userId || req.params.id || req.body.userId;
  
  if (req.user._id.toString() === targetUserId) {
    throw createError.forbidden(
      'Cannot perform this action on your own account',
      'SELF_ACTION_FORBIDDEN'
    );
  }

  next();
};

// Require additional confirmation for destructive admin actions
const requireConfirmation = (req, res, next) => {
  const confirmationHeader = req.headers['x-admin-confirmation'];
  const confirmationBody = req.body.confirmation;
  
  if (!confirmationHeader && !confirmationBody) {
    throw createError.badRequest(
      'Admin confirmation required for this action',
      'ADMIN_CONFIRMATION_REQUIRED'
    );
  }

  const expectedConfirmation = 'CONFIRM_DESTRUCTIVE_ACTION';
  
  if (confirmationHeader !== expectedConfirmation && confirmationBody !== expectedConfirmation) {
    throw createError.badRequest(
      'Invalid admin confirmation',
      'INVALID_ADMIN_CONFIRMATION'
    );
  }

  next();
};

// Validate IP whitelist for admin operations (if configured)
const validateAdminIP = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next();
  }

  const adminWhitelist = process.env.ADMIN_IP_WHITELIST;
  
  if (!adminWhitelist) {
    return next(); // No whitelist configured
  }

  const allowedIPs = adminWhitelist.split(',').map(ip => ip.trim());
  const clientIP = req.ip || req.connection.remoteAddress;

  if (!allowedIPs.includes(clientIP)) {
    throw createError.forbidden(
      'Admin access not allowed from this IP address',
      'ADMIN_IP_NOT_WHITELISTED'
    );
  }

  next();
};

// Check admin session timeout
const checkAdminSession = (sessionTimeout = 60 * 60 * 1000) => { // 1 hour default
  return (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return next();
    }

    const lastActivity = req.user.lastLogin || req.user.updatedAt;
    const timeSinceLastActivity = Date.now() - new Date(lastActivity).getTime();

    if (timeSinceLastActivity > sessionTimeout) {
      throw createError.unauthorized(
        'Admin session expired, please login again',
        'ADMIN_SESSION_EXPIRED'
      );
    }

    next();
  };
};

module.exports = {
  isAdmin,
  isAdminOrOwner,
  logAdminAction,
  validateAdminOperation,
  validateAdminAccount,
  adminRateLimit,
  preventSelfAction,
  requireConfirmation,
  validateAdminIP,
  checkAdminSession
}; 
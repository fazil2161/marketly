const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, createError } = require('./error');

// Protect routes - require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies (for browser requests)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    throw createError.unauthorized('Not authorized to access this route', 'NO_TOKEN');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user) {
      throw createError.unauthorized('User no longer exists', 'USER_NOT_FOUND');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError.unauthorized('User account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw createError.unauthorized('Invalid token', 'INVALID_TOKEN');
    } else if (error.name === 'TokenExpiredError') {
      throw createError.unauthorized('Token expired', 'TOKEN_EXPIRED');
    } else {
      throw error;
    }
  }
});

// Optional authentication - don't require token but set user if available
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token, continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists and is active
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
  }

  next();
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw createError.unauthorized('Not authorized to access this route', 'NO_USER');
    }

    if (!roles.includes(req.user.role)) {
      throw createError.forbidden(
        `User role ${req.user.role} is not authorized to access this route`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

// Check if user owns the resource or is admin
const ownerOrAdmin = (getResourceUserId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw createError.unauthorized('Not authorized to access this route', 'NO_USER');
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Get the user ID associated with the resource
    let resourceUserId;
    
    if (typeof getResourceUserId === 'function') {
      resourceUserId = await getResourceUserId(req);
    } else if (typeof getResourceUserId === 'string') {
      // If it's a string, treat it as a property path in req
      resourceUserId = req[getResourceUserId];
    } else {
      // Default to checking if the resource has a userId property
      resourceUserId = req.params.userId || req.body.userId;
    }

    // Check if user owns the resource
    if (req.user._id.toString() !== resourceUserId.toString()) {
      throw createError.forbidden(
        'Not authorized to access this resource',
        'RESOURCE_ACCESS_DENIED'
      );
    }

    next();
  });
};

// Verify refresh token
const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError.badRequest('Refresh token is required', 'MISSING_REFRESH_TOKEN');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    // Check if user exists and token matches
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user) {
      throw createError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (!user.isActive) {
      throw createError.unauthorized('User account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    if (user.refreshToken !== refreshToken) {
      throw createError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw createError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
    throw error;
  }
});

// Rate limiting for authentication routes
const authRateLimit = asyncHandler(async (req, res, next) => {
  // This is handled by express-rate-limit in server.js
  // This middleware can be used for additional custom rate limiting logic
  next();
});

// Check if user can perform action based on time restrictions
const timeBasedAccess = (options = {}) => {
  const { 
    startHour = 0, 
    endHour = 24, 
    timezone = 'UTC',
    errorMessage = 'Service not available at this time'
  } = options;

  return (req, res, next) => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < startHour || currentHour >= endHour) {
      throw createError.forbidden(errorMessage, 'TIME_RESTRICTED_ACCESS');
    }

    next();
  };
};

// Check if user email is verified (if email verification is enabled)
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    throw createError.unauthorized('Not authorized to access this route', 'NO_USER');
  }

  if (!req.user.isEmailVerified) {
    throw createError.forbidden(
      'Email verification required to access this resource',
      'EMAIL_NOT_VERIFIED'
    );
  }

  next();
};

// Log user activity
const logActivity = (action) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user) {
      // Log user activity (could be expanded to store in database)
      console.log(`User ${req.user._id} performed action: ${action} at ${new Date()}`);
      
      // Update last activity
      req.user.lastActivity = new Date();
      await req.user.save({ validateBeforeSave: false });
    }
    
    next();
  });
};

// Check user permissions for specific resources
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw createError.unauthorized('Not authorized to access this route', 'NO_USER');
    }

    // Simple permission check (can be expanded with a permission system)
    const userPermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_products', 'manage_orders'],
      user: ['read', 'write_own']
    };

    const permissions = userPermissions[req.user.role] || [];

    if (!permissions.includes(permission)) {
      throw createError.forbidden(
        `Permission '${permission}' required`,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

// Validate API key (for external integrations)
const validateApiKey = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    throw createError.unauthorized('API key required', 'MISSING_API_KEY');
  }

  // Validate API key (in a real app, this would check against a database)
  if (apiKey !== process.env.API_KEY) {
    throw createError.unauthorized('Invalid API key', 'INVALID_API_KEY');
  }

  next();
});

// Ensure HTTPS in production
const requireHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    throw createError.forbidden('HTTPS required in production', 'HTTPS_REQUIRED');
  }
  next();
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  ownerOrAdmin,
  verifyRefreshToken,
  authRateLimit,
  timeBasedAccess,
  requireEmailVerification,
  logActivity,
  checkPermission,
  validateApiKey,
  requireHTTPS
}; 
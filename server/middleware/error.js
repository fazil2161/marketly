const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else {
    console.error('Error:', err.message);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND'
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    let field = 'unknown';
    
    if (err.keyValue) {
      field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      
      // Customize message based on field
      switch (field) {
        case 'email':
          message = 'An account with this email already exists';
          break;
        case 'sku':
          message = 'A product with this SKU already exists';
          break;
        case 'orderNumber':
          message = 'Order number already exists';
          break;
        default:
          message = `${field} already exists: ${value}`;
      }
    }
    
    error = {
      message,
      statusCode: 400,
      code: 'DUPLICATE_FIELD',
      field
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const fields = Object.keys(err.errors);
    
    error = {
      message: messages.join(', '),
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      fields,
      details: messages
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED'
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large',
      statusCode: 400,
      code: 'FILE_TOO_LARGE'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      message: 'Too many files',
      statusCode: 400,
      code: 'TOO_MANY_FILES'
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      statusCode: 400,
      code: 'UNEXPECTED_FILE'
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    error = {
      message: 'Database connection error',
      statusCode: 500,
      code: 'DATABASE_ERROR'
    };
  }

  // Payment errors (for future Stripe integration)
  if (err.type && err.type.startsWith('Stripe')) {
    error = {
      message: 'Payment processing error',
      statusCode: 400,
      code: 'PAYMENT_ERROR',
      details: err.message
    };
  }

  // Network/timeout errors
  if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    error = {
      message: 'Service temporarily unavailable',
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE'
    };
  }

  // Permission errors
  if (err.code === 'PERMISSION_DENIED') {
    error = {
      message: 'Permission denied',
      statusCode: 403,
      code: 'PERMISSION_DENIED'
    };
  }

  // Business logic errors
  if (err.code === 'INSUFFICIENT_STOCK') {
    error = {
      message: 'Insufficient stock for this product',
      statusCode: 400,
      code: 'INSUFFICIENT_STOCK'
    };
  }

  if (err.code === 'ORDER_NOT_CANCELLABLE') {
    error = {
      message: 'This order cannot be cancelled',
      statusCode: 400,
      code: 'ORDER_NOT_CANCELLABLE'
    };
  }

  // Default error values
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || err.message || 'Server Error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  // Prepare response object
  const response = {
    success: false,
    error: {
      message,
      code,
      ...(error.field && { field: error.field }),
      ...(error.fields && { fields: error.fields }),
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err.stack,
        originalError: {
          name: err.name,
          message: err.message
        }
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add request ID if available (for tracking)
  if (req.id) {
    response.requestId = req.id;
  }

  // Set appropriate headers
  res.status(statusCode);
  
  // CORS headers for error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', true);

  // Security headers for error responses
  if (statusCode === 401) {
    res.header('WWW-Authenticate', 'Bearer realm="API"');
  }

  // Send JSON error response
  res.json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class for business logic errors
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to create common errors
const createError = {
  badRequest: (message = 'Bad Request', code = 'BAD_REQUEST') => 
    new AppError(message, 400, code),
  
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') => 
    new AppError(message, 401, code),
  
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') => 
    new AppError(message, 403, code),
  
  notFound: (message = 'Not Found', code = 'NOT_FOUND') => 
    new AppError(message, 404, code),
  
  conflict: (message = 'Conflict', code = 'CONFLICT') => 
    new AppError(message, 409, code),
  
  tooManyRequests: (message = 'Too Many Requests', code = 'RATE_LIMIT_EXCEEDED') => 
    new AppError(message, 429, code),
  
  internal: (message = 'Internal Server Error', code = 'INTERNAL_SERVER_ERROR') => 
    new AppError(message, 500, code),
  
  serviceUnavailable: (message = 'Service Unavailable', code = 'SERVICE_UNAVAILABLE') => 
    new AppError(message, 503, code)
};

// Not found middleware (should be placed before error handler)
const notFound = (req, res, next) => {
  const error = createError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  createError,
  notFound
}; 
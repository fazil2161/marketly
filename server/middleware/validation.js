const { validationResult } = require('express-validator');
const { createError } = require('./error');

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    const errorMessage = errorMessages.map(err => err.message).join(', ');
    
    const error = createError.badRequest(errorMessage, 'VALIDATION_ERROR');
    error.fields = errorMessages.map(err => err.field);
    error.details = errorMessages;
    
    throw error;
  }
  
  next();
};

module.exports = {
  validate
}; 
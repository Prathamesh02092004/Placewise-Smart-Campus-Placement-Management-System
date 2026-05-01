const logger = require('../utils/logger');
const { error } = require('../utils/response');


const notFoundHandler = (req, res) => {
  return error(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => { 
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, {
    stack: err.stack,
    userId: req.user?.userId,
  });

  // Sequelize Validation Error 
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return error(res, 422, 'Database validation failed.', errors);
  }

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path).join(', ');
    return error(res, 409, `Duplicate entry. The following must be unique: ${fields}`);
  }

  // Sequelize Foreign Key Constraint Error 
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 409, 'Operation failed: referenced record does not exist.');
  }

  // JWT Errors (handled in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    return error(res, 401, 'Invalid token.');
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 401, 'Token expired.');
  }

  //  Custom Application Error
  // Services throw: const err = new Error('msg'); err.statusCode = 409; throw err;
  if (err.statusCode) {
    return error(res, err.statusCode, err.message, err.details || null);
  }

  // Fallback: Unknown Error 
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred. Please try again later.'
    : err.message;

  return error(res, statusCode, message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = { errorHandler, notFoundHandler };
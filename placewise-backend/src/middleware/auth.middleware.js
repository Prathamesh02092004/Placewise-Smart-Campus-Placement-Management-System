const { verifyAccessToken } = require('../config/jwt');
const { error } = require('../utils/response');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 401, 'No token provided. Please log in.');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return error(res, 401, 'Malformed authorization header.');
    }
    const decoded = verifyAccessToken(token);
    req.user = decoded; 
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, 'Token expired. Please refresh your session.');
    }
    if (err.name === 'JsonWebTokenError') {
      return error(res, 401, 'Invalid token. Please log in again.');
    }
    return error(res, 401, 'Authentication failed.');
  }
};

module.exports = { authenticate };
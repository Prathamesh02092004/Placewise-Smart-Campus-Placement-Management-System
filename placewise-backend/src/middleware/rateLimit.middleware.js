const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');

const limitExceededHandler = (req, res) => {
  return error(
    res,
    429,
    'Too many requests. Please slow down and try again later.',
    { retryAfter: res.getHeader('Retry-After') }
  );
};
const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, 
  max: parseInt(process.env.RATE_LIMIT_MAX_PUBLIC) || 100,
  standardHeaders: true,   
  legacyHeaders: false,    
  handler: limitExceededHandler,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.ip, 
});

const loginLimiter = rateLimit({
  windowMs: 900000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitExceededHandler,
  skipSuccessfulRequests: true, 
  keyGenerator: (req) => req.ip,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_AUTH) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitExceededHandler,
  keyGenerator: (req) => req.user?.userId || req.ip,
});

module.exports = { publicLimiter, authLimiter, loginLimiter };
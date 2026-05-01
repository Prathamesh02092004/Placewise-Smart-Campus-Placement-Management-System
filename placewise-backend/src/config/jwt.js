const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('./env');

const signAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN, // seconds
    algorithm: 'HS256',
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

const refreshTokenExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);
  return expiry;
};

module.exports = {
  signAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  refreshTokenExpiry,
};
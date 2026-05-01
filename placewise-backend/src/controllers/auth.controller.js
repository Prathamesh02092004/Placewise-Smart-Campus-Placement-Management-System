const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',  
  path: '/',
};

const register = async (req, res, next) => {
  try {
    const { email, password, role, ...profileData } = req.body;
    const result = await authService.register({ email, password, role, profileData });
    return success(res, 201, 'Registration successful. Please verify your email.', result);
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.cookie('refreshToken', result.refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      expires: result.refreshExpiry,
    });

    return success(res, 200, 'Login successful.', {
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const incomingToken = req.cookies?.refreshToken;
    const result = await authService.refreshTokens(incomingToken);

    res.cookie('refreshToken', result.refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      expires: result.refreshExpiry,
    });

    return success(res, 200, 'Token refreshed.', { accessToken: result.accessToken });
  } catch (err) {
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.userId);
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    return success(res, 200, 'Logged out successfully.');
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await authService.verifyEmail(token);
    return success(res, 200, result.message);
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return success(res, 200, 'If an account exists with this email, a reset link has been sent.');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return success(res, 200, 'Password reset successfully. You can now log in.');
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.userId);
    return success(res, 200, 'User profile retrieved.', result);
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, verifyEmail, forgotPassword, resetPassword, getMe };
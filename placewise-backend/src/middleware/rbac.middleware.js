import { error } from '../utils/response.js';


const require = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 401, 'Not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        403,
        `Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`
      );
    }

    next();
  };
};

const requireOwnerOrStaff = (paramName = 'id') => {
  return (req, res, next) => {
    const privilegedRoles = ['placement', 'admin'];

    if (privilegedRoles.includes(req.user.role)) {
      return next();
    }

    if (req.params[paramName] !== req.user.userId) {
      return error(res, 403, 'You can only access your own records.');
    }

    next();
  };
};

export { require, requireOwnerOrStaff };
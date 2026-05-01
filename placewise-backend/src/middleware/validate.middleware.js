const Joi = require('joi');
const { error } = require('../utils/response');


const validate = (schemas) => {
  return (req, res, next) => {
    const validationErrors = [];
    if (schemas.body) {
      const { error: err, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (err) {
        validationErrors.push(...err.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          location: 'body',
        })));
      } else {
        req.body = value; 
      }
    }
    if (schemas.params) {
      const { error: err, value } = schemas.params.validate(req.params, {
        abortEarly: false,
      });
      if (err) {
        validationErrors.push(...err.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          location: 'params',
        })));
      } else {
        req.params = value;
      }
    }
    if (schemas.query) {
      const { error: err, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (err) {
        validationErrors.push(...err.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
          location: 'query',
        })));
      } else {
        req.query = value;
      }
    }

    if (validationErrors.length > 0) {
      return error(res, 422, 'Validation failed.', validationErrors);
    }
    next();
  };
};

module.exports = { validate };
/**
 * Send a successful response.
 * @param {object} res   - Express response object
 * @param {number} statusCode - HTTP status (default 200)
 * @param {string} message    - Human-readable message
 * @param {*}      data       - Response payload
 */
const success = (res, statusCode = 200, message = 'Success', data = null) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {object} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*}      errors  - Validation errors or details
 */
const error = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Paginated response wrapper.
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

module.exports = { success, error, paginated };
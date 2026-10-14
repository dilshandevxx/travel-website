const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// Converts any thrown error into a consistent JSON response:
// { success: false, error: { message, details? } }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err instanceof UniqueConstraintError) {
    error = ApiError.conflict('A record with these details already exists');
  } else if (err instanceof ForeignKeyConstraintError) {
    error = ApiError.badRequest('A referenced record does not exist');
  } else if (err instanceof ValidationError) {
    error = ApiError.badRequest(
      'Validation failed',
      err.errors.map((e) => ({ field: e.path, message: e.message }))
    );
  } else if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Request body is not valid JSON');
  } else if (!(err instanceof ApiError)) {
    // Unexpected error: log it, but never leak internals to the client
    if (!env.isTest) console.error(err);
    error = new ApiError(500, 'Something went wrong. Please try again later.');
  }

  const body = { success: false, error: { message: error.message } };
  if (error.details) body.error.details = error.details;

  res.status(error.statusCode).json(body);
};

module.exports = { notFound, errorHandler };

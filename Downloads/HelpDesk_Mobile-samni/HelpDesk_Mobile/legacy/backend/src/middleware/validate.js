const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after a list of express-validator rules and stops the request with a
 * 400 response if any rule failed.
 *
 *   router.post('/', validate(registerRules), controller.register);
 */
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const details = result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      }));
      throw ApiError.badRequest('Validation failed', details);
    }
    next();
  },
];

module.exports = validate;

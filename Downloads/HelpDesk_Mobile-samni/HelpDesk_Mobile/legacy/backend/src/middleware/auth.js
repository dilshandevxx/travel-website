const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

/**
 * Requires a valid "Authorization: Bearer <token>" header.
 * Loads the user from the database (so deactivated users and role changes
 * take effect immediately) and attaches it as req.user.
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized();
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  req.user = user;
  next();
};

/**
 * Role-based access control. Use after authenticate:
 *
 *   router.post('/', authenticate, authorize('admin'), controller.create);
 */
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };

module.exports = { authenticate, authorize };

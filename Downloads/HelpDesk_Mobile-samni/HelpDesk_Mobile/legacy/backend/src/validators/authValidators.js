const { body } = require('express-validator');

const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

const fullName = () =>
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('fullName must be 2-100 characters');

const phone = () =>
  body('phone').optional().trim().matches(PHONE_PATTERN).withMessage('phone must be a valid phone number');

const register = [
  fullName(),
  body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required'),
  // bcrypt only uses the first 72 bytes of a password
  body('password').isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters'),
  phone(),
  body('role')
    .optional()
    .isIn(['customer', 'provider'])
    .withMessage('role must be either customer or provider'),
];

const login = [
  body('email').trim().toLowerCase().isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('password is required'),
];

const updateMe = [fullName().optional(), phone()];

module.exports = { register, login, updateMe };

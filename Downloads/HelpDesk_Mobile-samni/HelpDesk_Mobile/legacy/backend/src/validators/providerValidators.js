const { body, query } = require('express-validator');
const { idParam, paginationQuery } = require('./common');

const list = [
  query('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId must be a positive integer').toInt(),
  query('city').optional().trim().isLength({ max: 100 }),
  query('available').optional().isBoolean().withMessage('available must be true or false').toBoolean(),
  query('verified').optional().isBoolean().withMessage('verified must be true or false').toBoolean(),
  ...paginationQuery,
];

const getById = [idParam()];

const listReviews = [idParam(), ...paginationQuery];

const updateMyProfile = [
  body('bio').optional().trim().isLength({ max: 1000 }).withMessage('bio must be at most 1000 characters'),
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 80 })
    .withMessage('yearsOfExperience must be between 0 and 80')
    .toInt(),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('hourlyRate must be 0 or more').toFloat(),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('city must be at most 100 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90').toFloat(),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180')
    .toFloat(),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be true or false').toBoolean(),
  body('categoryIds').optional().isArray({ max: 20 }).withMessage('categoryIds must be an array'),
  body('categoryIds.*').isInt({ min: 1 }).withMessage('categoryIds must contain category ids').toInt(),
];

const setVerification = [
  idParam(),
  body('isVerified').isBoolean().withMessage('isVerified must be true or false').toBoolean(),
];

module.exports = { list, getById, listReviews, updateMyProfile, setVerification };

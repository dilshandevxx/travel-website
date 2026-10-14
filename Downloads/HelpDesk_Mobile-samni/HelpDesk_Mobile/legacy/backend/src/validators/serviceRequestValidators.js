const { body, query } = require('express-validator');
const { idParam, paginationQuery } = require('./common');
const { STATUSES } = require('../models').ServiceRequest;

const create = [
  body('categoryId').isInt({ min: 1 }).withMessage('categoryId is required').toInt(),
  // Optional: send the request to one specific provider (their user id)
  body('providerId').optional().isInt({ min: 1 }).withMessage('providerId must be a positive integer').toInt(),
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('title must be 3-150 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('description must be 10-2000 characters'),
  body('address').trim().isLength({ min: 5, max: 255 }).withMessage('address must be 5-255 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90').toFloat(),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180')
    .toFloat(),
  body('preferredDate').optional().isISO8601().withMessage('preferredDate must be an ISO 8601 date').toDate(),
];

const list = [
  query('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  ...paginationQuery,
];

const byId = [idParam()];

const cancel = [
  idParam(),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('reason must be at most 500 characters'),
];

const review = [
  idParam(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be a whole number from 1 to 5').toInt(),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('comment must be at most 1000 characters'),
];

module.exports = { create, list, byId, cancel, review };

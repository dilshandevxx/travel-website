const { body } = require('express-validator');
const { idParam } = require('./common');

const create = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('description is too long'),
];

const update = [
  idParam(),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('description is too long'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

module.exports = { create, update };

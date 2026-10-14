const { param, query } = require('express-validator');

const idParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage(`${name} must be a positive integer`).toInt();

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100').toInt(),
];

module.exports = { idParam, paginationQuery };

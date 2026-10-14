const { matchedData } = require('express-validator');
const categoryService = require('../services/categoryService');

const list = async (req, res) => {
  const categories = await categoryService.list();
  res.json({ success: true, data: { categories } });
};

const create = async (req, res) => {
  const category = await categoryService.create(matchedData(req));
  res.status(201).json({ success: true, data: { category } });
};

const update = async (req, res) => {
  const { id, ...changes } = matchedData(req);
  const category = await categoryService.update(id, changes);
  res.json({ success: true, data: { category } });
};

module.exports = { list, create, update };

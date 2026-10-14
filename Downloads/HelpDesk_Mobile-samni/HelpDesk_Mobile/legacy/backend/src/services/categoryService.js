const { ServiceCategory } = require('../models');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

const list = async ({ includeInactive = false } = {}) =>
  ServiceCategory.findAll({
    where: includeInactive ? {} : { isActive: true },
    order: [['name', 'ASC']],
  });

const create = async ({ name, description }) => ServiceCategory.create({ name, description, slug: slugify(name) });

const update = async (id, changes) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  if (changes.name) {
    changes.slug = slugify(changes.name);
  }
  await category.update(changes);
  return category;
};

module.exports = { list, create, update };

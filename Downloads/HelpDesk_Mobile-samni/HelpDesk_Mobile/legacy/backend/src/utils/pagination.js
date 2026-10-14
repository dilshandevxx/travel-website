const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Turns ?page=&limit= into Sequelize limit/offset
const getPagination = ({ page, limit } = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
};

const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { getPagination, buildMeta, MAX_LIMIT };

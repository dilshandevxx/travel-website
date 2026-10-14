/**
 * Provider profiles. Providers are always identified by their USER id in the
 * API (the same id used in serviceRequest.providerId), never by profile id.
 */
const { Op } = require('sequelize');
const { sequelize, User, ProviderProfile, ProviderCategory, ServiceCategory, Review } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');

// Public info only — email and phone are not shown in provider listings
const publicUserInclude = {
  model: User,
  as: 'user',
  attributes: ['id', 'fullName'],
  where: { isActive: true, role: 'provider' },
};

const categoriesInclude = {
  model: ServiceCategory,
  as: 'categories',
  attributes: ['id', 'name', 'slug'],
  through: { attributes: [] },
};

const list = async ({ categoryId, city, available, verified, page, limit }) => {
  const pagination = getPagination({ page, limit });
  const where = {};

  if (categoryId) {
    const links = await ProviderCategory.findAll({ where: { categoryId }, attributes: ['providerProfileId'] });
    where.id = links.map((link) => link.providerProfileId);
  }
  if (city) where[Op.and] = [sequelize.where(sequelize.fn('LOWER', sequelize.col('city')), city.toLowerCase())];
  if (available !== undefined) where.isAvailable = available;
  if (verified !== undefined) where.isVerified = verified;

  const { rows, count } = await ProviderProfile.findAndCountAll({
    where,
    include: [publicUserInclude, categoriesInclude],
    order: [
      ['isVerified', 'DESC'],
      ['averageRating', 'DESC'],
      ['id', 'ASC'],
    ],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true, // count providers, not provider x category rows
  });

  return { providers: rows, meta: buildMeta(pagination, count) };
};

const getByUserId = async (userId) => {
  const profile = await ProviderProfile.findOne({
    where: { userId },
    include: [publicUserInclude, categoriesInclude],
  });
  if (!profile) {
    throw ApiError.notFound('Provider not found');
  }
  return profile;
};

const getMyProfile = async (userId) =>
  ProviderProfile.findOne({ where: { userId }, include: [categoriesInclude] });

const updateMyProfile = async (userId, { categoryIds, ...changes }) => {
  await sequelize.transaction(async (transaction) => {
    const profile = await ProviderProfile.findOne({ where: { userId }, transaction });

    await profile.update(changes, { transaction });

    if (categoryIds !== undefined) {
      const uniqueIds = [...new Set(categoryIds)];
      const categories = await ServiceCategory.findAll({
        where: { id: uniqueIds, isActive: true },
        transaction,
      });
      if (categories.length !== uniqueIds.length) {
        throw ApiError.badRequest('One or more categoryIds do not exist or are inactive');
      }
      await profile.setCategories(categories, { transaction });
    }
  });

  return getMyProfile(userId);
};

const setVerification = async (userId, isVerified) => {
  const profile = await ProviderProfile.findOne({ where: { userId } });
  if (!profile) {
    throw ApiError.notFound('Provider not found');
  }
  await profile.update({ isVerified });
  return profile;
};

const listReviews = async (userId, { page, limit }) => {
  await getByUserId(userId); // 404 if the provider doesn't exist

  const pagination = getPagination({ page, limit });
  const { rows, count } = await Review.findAndCountAll({
    where: { providerId: userId },
    include: [{ model: User, as: 'customer', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  return { reviews: rows, meta: buildMeta(pagination, count) };
};

module.exports = { list, getByUserId, getMyProfile, updateMyProfile, setVerification, listReviews };

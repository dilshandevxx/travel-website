/**
 * Service requests (jobs) and their lifecycle. See the status diagram in
 * models/serviceRequest.js.
 *
 * Status changes use a single conditional UPDATE ("... WHERE status = 'pending'")
 * so two providers accepting the same job at the same moment can't both win.
 */
const { Op } = require('sequelize');
const { sequelize, User, ServiceCategory, ServiceRequest, ProviderProfile, Review } = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildMeta } = require('../utils/pagination');

const detailIncludes = [
  { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone'] },
  { model: User, as: 'provider', attributes: ['id', 'fullName', 'phone'] },
  { model: ServiceCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
];

const getProviderCategoryIds = async (providerUserId) => {
  const profile = await ProviderProfile.findOne({
    where: { userId: providerUserId },
    include: [{ model: ServiceCategory, as: 'categories', attributes: ['id'], through: { attributes: [] } }],
  });
  return profile ? profile.categories.map((category) => category.id) : [];
};

// Pending jobs a provider may accept: open jobs in their categories, or jobs sent directly to them
const availableToProviderWhere = (providerUserId, categoryIds) => ({
  status: 'pending',
  [Op.or]: [{ providerId: null, categoryId: categoryIds }, { providerId: providerUserId }],
});

const canView = async (user, request) => {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return request.customerId === user.id;
  if (request.providerId === user.id) return true;
  if (request.status === 'pending' && request.providerId === null) {
    const categoryIds = await getProviderCategoryIds(user.id);
    return categoryIds.includes(request.categoryId);
  }
  return false;
};

const findVisibleOrFail = async (user, id) => {
  const request = await ServiceRequest.findByPk(id, {
    include: [...detailIncludes, { model: Review, as: 'review' }],
  });
  // Respond 404 (not 403) so users can't probe which ids exist
  if (!request || !(await canView(user, request))) {
    throw ApiError.notFound('Service request not found');
  }
  return request;
};

/**
 * Applies a status change only if the row still matches `where`.
 * If nothing matched, works out the right error to return.
 */
const transition = async (user, id, where, changes, actionName) => {
  const [updatedCount] = await ServiceRequest.update(changes, { where: { id, ...where } });

  if (updatedCount === 0) {
    const request = await findVisibleOrFail(user, id);
    throw ApiError.conflict(`Cannot ${actionName} a service request with status "${request.status}"`);
  }
  return findVisibleOrFail(user, id);
};

// ---------- Customer ----------

const create = async (customer, data) => {
  const category = await ServiceCategory.findOne({ where: { id: data.categoryId, isActive: true } });
  if (!category) {
    throw ApiError.badRequest('categoryId does not match an active category');
  }

  if (data.providerId) {
    const provider = await User.findOne({
      where: { id: data.providerId, role: 'provider', isActive: true },
      include: [{ model: ProviderProfile, as: 'providerProfile' }],
    });
    if (!provider) {
      throw ApiError.badRequest('providerId does not match an active provider');
    }
    if (!provider.providerProfile.isAvailable) {
      throw ApiError.conflict('This provider is not currently accepting jobs');
    }
    const categoryIds = await getProviderCategoryIds(provider.id);
    if (!categoryIds.includes(category.id)) {
      throw ApiError.badRequest('This provider does not offer the selected category');
    }
  }

  const request = await ServiceRequest.create({ ...data, customerId: customer.id, status: 'pending' });
  return findVisibleOrFail(customer, request.id);
};

const cancel = async (user, id, reason) => {
  const ownership = {
    customer: { customerId: user.id, status: ['pending', 'accepted'] },
    provider: { providerId: user.id, status: 'accepted' },
    admin: { status: ['pending', 'accepted', 'in_progress'] },
  }[user.role];

  return transition(
    user,
    id,
    ownership,
    { status: 'cancelled', cancelledAt: new Date(), cancelledById: user.id, cancellationReason: reason || null },
    'cancel'
  );
};

// ---------- Listing ----------

// "My requests": a customer's own requests, a provider's assigned jobs, or everything for admins
const listMine = async (user, { status, page, limit }) => {
  const pagination = getPagination({ page, limit });
  const where = {};
  if (user.role === 'customer') where.customerId = user.id;
  if (user.role === 'provider') where.providerId = user.id;
  if (status) where.status = status;

  const { rows, count } = await ServiceRequest.findAndCountAll({
    where,
    include: detailIncludes,
    order: [['createdAt', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { serviceRequests: rows, meta: buildMeta(pagination, count) };
};

// Job feed for providers
const listAvailable = async (provider, { page, limit }) => {
  const pagination = getPagination({ page, limit });
  const categoryIds = await getProviderCategoryIds(provider.id);

  const { rows, count } = await ServiceRequest.findAndCountAll({
    where: availableToProviderWhere(provider.id, categoryIds),
    include: detailIncludes,
    order: [['createdAt', 'ASC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });
  return { serviceRequests: rows, meta: buildMeta(pagination, count) };
};

const getById = findVisibleOrFail;

// ---------- Provider actions ----------

const accept = async (provider, id) => {
  const categoryIds = await getProviderCategoryIds(provider.id);
  return transition(
    provider,
    id,
    availableToProviderWhere(provider.id, categoryIds),
    { status: 'accepted', providerId: provider.id, acceptedAt: new Date() },
    'accept'
  );
};

// Only for requests sent directly to this provider
const decline = (provider, id) =>
  transition(provider, id, { providerId: provider.id, status: 'pending' }, { status: 'declined' }, 'decline');

const start = (provider, id) =>
  transition(
    provider,
    id,
    { providerId: provider.id, status: 'accepted' },
    { status: 'in_progress', startedAt: new Date() },
    'start'
  );

const complete = (provider, id) =>
  transition(
    provider,
    id,
    { providerId: provider.id, status: 'in_progress' },
    { status: 'completed', completedAt: new Date() },
    'complete'
  );

// ---------- Reviews ----------

const addReview = async (customer, id, { rating, comment }) => {
  const request = await ServiceRequest.findOne({ where: { id, customerId: customer.id } });
  if (!request) {
    throw ApiError.notFound('Service request not found');
  }
  if (request.status !== 'completed') {
    throw ApiError.conflict('You can only review a completed service request');
  }

  return sequelize.transaction(async (transaction) => {
    // Lock the provider's profile row so simultaneous reviews update the average one at a time
    const profile = await ProviderProfile.findOne({
      where: { userId: request.providerId },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const existing = await Review.findOne({ where: { serviceRequestId: id }, transaction });
    if (existing) {
      throw ApiError.conflict('This service request has already been reviewed');
    }

    const review = await Review.create(
      { serviceRequestId: id, customerId: customer.id, providerId: request.providerId, rating, comment },
      { transaction }
    );

    const stats = await Review.findOne({
      where: { providerId: request.providerId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
      ],
      raw: true,
      transaction,
    });
    await profile.update(
      { averageRating: Number(stats.average).toFixed(2), totalReviews: Number(stats.total) },
      { transaction }
    );

    return review;
  });
};

module.exports = { create, cancel, listMine, listAvailable, getById, accept, decline, start, complete, addReview };

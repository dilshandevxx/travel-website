/**
 * Creates the Sequelize connection, loads every model and defines the
 * relationships between them. Import models from here:
 *
 *   const { User, ServiceRequest } = require('../models');
 */
const env = require('../config/env');
const { Sequelize } = require('sequelize');
const dbConfig = require('../../../database/config/config')[env.nodeEnv];

const sequelize = dbConfig.use_env_variable
  ? new Sequelize(process.env[dbConfig.use_env_variable], dbConfig)
  : new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);

const User = require('./user')(sequelize);
const ServiceCategory = require('./serviceCategory')(sequelize);
const ProviderProfile = require('./providerProfile')(sequelize);
const ProviderCategory = require('./providerCategory')(sequelize);
const ServiceRequest = require('./serviceRequest')(sequelize);
const Review = require('./review')(sequelize);

// ---------- Relationships ----------

// A provider user has one profile
User.hasOne(ProviderProfile, { as: 'providerProfile', foreignKey: 'userId' });
ProviderProfile.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// A provider offers many categories; a category has many providers
ProviderProfile.belongsToMany(ServiceCategory, {
  through: ProviderCategory,
  as: 'categories',
  foreignKey: 'providerProfileId',
  otherKey: 'categoryId',
});
ServiceCategory.belongsToMany(ProviderProfile, {
  through: ProviderCategory,
  as: 'providers',
  foreignKey: 'categoryId',
  otherKey: 'providerProfileId',
});

// A service request belongs to a customer, a provider (once assigned) and a category
ServiceRequest.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
ServiceRequest.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });
ServiceRequest.belongsTo(ServiceCategory, { as: 'category', foreignKey: 'categoryId' });
ServiceRequest.hasOne(Review, { as: 'review', foreignKey: 'serviceRequestId' });

Review.belongsTo(ServiceRequest, { as: 'serviceRequest', foreignKey: 'serviceRequestId' });
Review.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Review.belongsTo(User, { as: 'provider', foreignKey: 'providerId' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  ServiceCategory,
  ProviderProfile,
  ProviderCategory,
  ServiceRequest,
  Review,
};

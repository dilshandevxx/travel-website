const { DataTypes } = require('sequelize');

/**
 * Job lifecycle:
 *
 *   pending ──accept──► accepted ──start──► in_progress ──complete──► completed
 *     │                   │
 *     ├──decline──► declined (only when sent to one specific provider)
 *     └──cancel───► cancelled ◄──cancel──┘
 */
const STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined'];

module.exports = (sequelize) => {
  const ServiceRequest = sequelize.define(
    'ServiceRequest',
    {
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // User id of the provider. Null while the request is open to any provider in the category.
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      preferredDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'pending',
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cancelledById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      acceptedAt: { type: DataTypes.DATE, allowNull: true },
      startedAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      cancelledAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: 'service_requests' }
  );

  ServiceRequest.STATUSES = STATUSES;

  return ServiceRequest;
};

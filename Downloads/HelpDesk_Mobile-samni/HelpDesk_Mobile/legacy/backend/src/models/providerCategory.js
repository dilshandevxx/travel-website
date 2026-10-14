const { DataTypes } = require('sequelize');

// Join table: which service categories each provider offers
module.exports = (sequelize) =>
  sequelize.define(
    'ProviderCategory',
    {
      providerProfileId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    { tableName: 'provider_categories', timestamps: false }
  );

const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Review',
    {
      // One review per completed service request
      serviceRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      providerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    { tableName: 'reviews' }
  );

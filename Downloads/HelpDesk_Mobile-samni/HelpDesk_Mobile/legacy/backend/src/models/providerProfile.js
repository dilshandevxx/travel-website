const { DataTypes } = require('sequelize');

// PostgreSQL returns DECIMAL columns as strings; convert them so the apps receive numbers
const decimalAsNumber = (field) => ({
  get() {
    const value = this.getDataValue(field);
    return value === null || value === undefined ? value : Number(value);
  },
});

module.exports = (sequelize) =>
  sequelize.define(
    'ProviderProfile',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      yearsOfExperience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      hourlyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        ...decimalAsNumber('hourlyRate'),
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      averageRating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0,
        ...decimalAsNumber('averageRating'),
      },
      totalReviews: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    { tableName: 'provider_profiles' }
  );

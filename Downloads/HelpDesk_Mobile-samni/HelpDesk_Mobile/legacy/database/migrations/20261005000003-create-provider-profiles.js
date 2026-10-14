/**
 * DRAFT migration — written by Member 3 (Backend) so the API can run.
 * Owned by Member 4 (Database): review and adjust, but keep in sync with
 * the matching model in backend/src/models/.
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provider_profiles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      bio: { type: Sequelize.TEXT, allowNull: true },
      years_of_experience: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      hourly_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: true },
      latitude: { type: Sequelize.DOUBLE, allowNull: true },
      longitude: { type: Sequelize.DOUBLE, allowNull: true },
      is_available: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_verified: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      average_rating: { type: Sequelize.DECIMAL(3, 2), allowNull: false, defaultValue: 0 },
      total_reviews: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_profiles');
  },
};

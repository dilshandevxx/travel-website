/**
 * DRAFT migration — written by Member 3 (Backend) so the API can run.
 * Owned by Member 4 (Database): review and adjust, but keep in sync with
 * the matching model in backend/src/models/.
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provider_categories', {
      provider_profile_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'provider_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'service_categories', key: 'id' },
        onDelete: 'CASCADE',
      },
    });
    // Speeds up "find providers who offer category X"
    await queryInterface.addIndex('provider_categories', ['category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_categories');
  },
};

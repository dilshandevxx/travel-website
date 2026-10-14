/**
 * DRAFT migration — written by Member 3 (Backend) so the API can run.
 * Owned by Member 4 (Database): review and adjust, but keep in sync with
 * the matching model in backend/src/models/.
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_requests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'service_categories', key: 'id' },
        onDelete: 'RESTRICT',
      },
      title: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      address: { type: Sequelize.STRING(255), allowNull: false },
      latitude: { type: Sequelize.DOUBLE, allowNull: true },
      longitude: { type: Sequelize.DOUBLE, allowNull: true },
      preferred_date: { type: Sequelize.DATE, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined'),
        allowNull: false,
        defaultValue: 'pending',
      },
      cancellation_reason: { type: Sequelize.TEXT, allowNull: true },
      cancelled_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      accepted_at: { type: Sequelize.DATE, allowNull: true },
      started_at: { type: Sequelize.DATE, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('service_requests', ['customer_id']);
    await queryInterface.addIndex('service_requests', ['provider_id']);
    await queryInterface.addIndex('service_requests', ['status', 'category_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_requests');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_service_requests_status";');
  },
};

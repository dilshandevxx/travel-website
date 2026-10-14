/**
 * DRAFT migration — written by Member 3 (Backend) so the API can run.
 * Owned by Member 4 (Database): review and adjust, but keep in sync with
 * the matching model in backend/src/models/.
 */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      service_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'service_requests', key: 'id' },
        onDelete: 'CASCADE',
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      rating: { type: Sequelize.SMALLINT, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addConstraint('reviews', {
      fields: ['rating'],
      type: 'check',
      name: 'reviews_rating_range',
      where: { rating: { [Sequelize.Op.between]: [1, 5] } },
    });
    await queryInterface.addIndex('reviews', ['provider_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
  },
};

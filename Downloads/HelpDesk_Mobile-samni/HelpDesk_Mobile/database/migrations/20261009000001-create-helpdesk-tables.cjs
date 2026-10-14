'use strict';

// PostgreSQL schema equivalent to the JSON database (src/types `Database`).
// The app runs on the JSON file today; this migration is the path to a real database.
//
// Run with sequelize-cli (not installed by default):
//   npx sequelize-cli db:migrate --migrations-path database/migrations --url "$DATABASE_URL"
//
// Column names are snake_case versions of the JSON fields, so rows map one-to-one.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;
    const id = { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true };
    const ref = (table, opts = {}) => ({
      type: DataTypes.INTEGER,
      allowNull: opts.allowNull ?? false,
      references: { model: table, key: 'id' },
      onDelete: opts.onDelete ?? 'CASCADE',
    });
    const timestamp = (allowNull = true) => ({ type: DataTypes.DATE, allowNull });
    const money = (allowNull = false) => ({ type: DataTypes.INTEGER, allowNull }); // whole LKR

    await queryInterface.sequelize.transaction(async (transaction) => {
      const t = { transaction };

      await queryInterface.createTable(
        'users',
        {
          id,
          full_name: { type: DataTypes.STRING(100), allowNull: false },
          email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
          phone: { type: DataTypes.STRING(20) },
          role: { type: DataTypes.ENUM('CUSTOMER', 'PROVIDER', 'ADMIN'), allowNull: false },
          is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
          avatar_color: { type: DataTypes.STRING(9), allowNull: false },
          password_hash: { type: DataTypes.STRING(200), allowNull: false },
          created_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'user_settings',
        {
          user_id: { ...ref('users'), primaryKey: true },
          notify_booking_updates: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
          notify_messages: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
          notify_promotions: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          language: { type: DataTypes.ENUM('en', 'si', 'ta'), allowNull: false, defaultValue: 'en' },
        },
        t,
      );

      await queryInterface.createTable(
        'addresses',
        {
          id,
          user_id: ref('users'),
          label: { type: DataTypes.STRING(40), allowNull: false },
          line1: { type: DataTypes.STRING(255), allowNull: false },
          city: { type: DataTypes.STRING(100), allowNull: false },
          district: { type: DataTypes.STRING(100), allowNull: false },
          latitude: { type: DataTypes.DOUBLE, allowNull: false },
          longitude: { type: DataTypes.DOUBLE, allowNull: false },
          is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        },
        t,
      );

      await queryInterface.createTable(
        'categories',
        {
          id,
          slug: { type: DataTypes.STRING(50), allowNull: false, unique: true },
          name: { type: DataTypes.STRING(100), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
          is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        },
        t,
      );

      await queryInterface.createTable(
        'pricing_rules',
        {
          id,
          category_id: { ...ref('categories'), unique: true },
          base_fee: money(),
          min_hourly_rate: money(),
          max_hourly_rate: money(),
          updated_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'provider_profiles',
        {
          id,
          user_id: { ...ref('users'), unique: true },
          status: {
            type: DataTypes.ENUM('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED'),
            allowNull: false,
            defaultValue: 'NOT_SUBMITTED',
          },
          bio: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
          years_of_experience: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          hourly_rate: money(),
          city: { type: DataTypes.STRING(100), allowNull: false },
          latitude: { type: DataTypes.DOUBLE, allowNull: false },
          longitude: { type: DataTypes.DOUBLE, allowNull: false },
          is_available: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          average_rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false, defaultValue: 0 },
          total_reviews: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          completed_jobs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
          nic_number: { type: DataTypes.STRING(12) },
          verification_note: { type: DataTypes.TEXT },
          submitted_at: timestamp(),
          verified_at: timestamp(),
        },
        t,
      );

      // JSON `categoryIds` array becomes a join table.
      await queryInterface.createTable(
        'provider_categories',
        {
          provider_profile_id: { ...ref('provider_profiles'), primaryKey: true },
          category_id: { ...ref('categories'), primaryKey: true },
        },
        t,
      );

      await queryInterface.createTable(
        'service_requests',
        {
          id,
          customer_id: ref('users'),
          requested_provider_id: ref('users', { allowNull: true, onDelete: 'SET NULL' }),
          provider_id: ref('users', { allowNull: true, onDelete: 'SET NULL' }),
          category_id: ref('categories', { onDelete: 'RESTRICT' }),
          title: { type: DataTypes.STRING(150), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          address: { type: DataTypes.STRING(255), allowNull: false },
          city: { type: DataTypes.STRING(100), allowNull: false },
          latitude: { type: DataTypes.DOUBLE, allowNull: false },
          longitude: { type: DataTypes.DOUBLE, allowNull: false },
          preferred_date: timestamp(),
          urgency: { type: DataTypes.ENUM('LOW', 'NORMAL', 'URGENT'), allowNull: false, defaultValue: 'NORMAL' },
          status: {
            type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED', 'CANCELLED'),
            allowNull: false,
            defaultValue: 'PENDING',
          },
          estimated_cost: money(),
          final_cost: money(true),
          ai_summary: { type: DataTypes.TEXT },
          cancellation_reason: { type: DataTypes.STRING(500) },
          cancelled_by_id: ref('users', { allowNull: true, onDelete: 'SET NULL' }),
          created_at: timestamp(false),
          updated_at: timestamp(false),
          accepted_at: timestamp(),
          on_the_way_at: timestamp(),
          started_at: timestamp(),
          invoiced_at: timestamp(),
          completed_at: timestamp(),
          cancelled_at: timestamp(),
        },
        t,
      );
      await queryInterface.addIndex('service_requests', ['status', 'category_id'], t);
      await queryInterface.addIndex('service_requests', ['customer_id'], t);
      await queryInterface.addIndex('service_requests', ['provider_id'], t);

      await queryInterface.createTable(
        'status_history',
        {
          id,
          service_request_id: ref('service_requests'),
          from_status: { type: DataTypes.STRING(40) },
          to_status: { type: DataTypes.STRING(40), allowNull: false },
          changed_by_id: ref('users'),
          note: { type: DataTypes.TEXT },
          created_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'cost_proposals',
        {
          id,
          service_request_id: ref('service_requests'),
          provider_id: ref('users'),
          amount: money(),
          note: { type: DataTypes.STRING(500), allowNull: false },
          status: { type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED'), allowNull: false, defaultValue: 'PENDING' },
          created_at: timestamp(false),
          responded_at: timestamp(),
        },
        t,
      );

      await queryInterface.createTable(
        'messages',
        {
          id,
          service_request_id: ref('service_requests'),
          sender_id: ref('users'),
          body: { type: DataTypes.STRING(1000), allowNull: false },
          created_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'reviews',
        {
          id,
          service_request_id: { ...ref('service_requests'), unique: true },
          customer_id: ref('users'),
          provider_id: ref('users'),
          rating: { type: DataTypes.SMALLINT, allowNull: false },
          comment: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
          provider_response: { type: DataTypes.TEXT },
          created_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'complaints',
        {
          id,
          service_request_id: ref('service_requests'),
          raised_by_id: ref('users'),
          reason: { type: DataTypes.STRING(100), allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          status: { type: DataTypes.ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'), allowNull: false, defaultValue: 'OPEN' },
          resolution: { type: DataTypes.TEXT },
          created_at: timestamp(false),
          updated_at: timestamp(false),
        },
        t,
      );

      await queryInterface.createTable(
        'notifications',
        {
          id,
          user_id: ref('users'),
          type: { type: DataTypes.STRING(30), allowNull: false },
          title: { type: DataTypes.STRING(200), allowNull: false },
          body: { type: DataTypes.TEXT, allowNull: false },
          service_request_id: ref('service_requests', { allowNull: true, onDelete: 'SET NULL' }),
          read_at: timestamp(),
          created_at: timestamp(false),
        },
        t,
      );
      await queryInterface.addIndex('notifications', ['user_id', 'read_at'], t);

      await queryInterface.createTable(
        'audit_logs',
        {
          id,
          actor_id: ref('users', { onDelete: 'RESTRICT' }),
          action: { type: DataTypes.STRING(60), allowNull: false },
          entity: { type: DataTypes.STRING(60), allowNull: false },
          entity_id: { type: DataTypes.INTEGER, allowNull: false },
          details: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
          created_at: timestamp(false),
        },
        t,
      );
    });
  },

  async down(queryInterface) {
    const tables = [
      'audit_logs',
      'notifications',
      'complaints',
      'reviews',
      'messages',
      'cost_proposals',
      'status_history',
      'service_requests',
      'provider_categories',
      'provider_profiles',
      'pricing_rules',
      'categories',
      'addresses',
      'user_settings',
      'users',
    ];
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of tables) await queryInterface.dropTable(table, { transaction, cascade: true });
      // Postgres keeps ENUM types after dropping tables.
      for (const type of [
        'enum_users_role',
        'enum_user_settings_language',
        'enum_provider_profiles_status',
        'enum_service_requests_urgency',
        'enum_service_requests_status',
        'enum_cost_proposals_status',
        'enum_complaints_status',
      ]) {
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${type}";`, { transaction });
      }
    });
  },
};

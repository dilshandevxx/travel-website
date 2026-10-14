'use strict';

// Loads the demo data from data/helpdesk-db.json into the PostgreSQL schema created by
// database/migrations. The JSON file stays the single source of demo data, so run
// `npm run db:reset` first if you want a clean copy.
//
//   npx sequelize-cli db:seed:all --seeders-path database/seeders --url "$DATABASE_URL"
//
// Passwords are already hashed (scrypt) in the JSON file and are copied as-is.

const fs = require('node:fs');
const path = require('node:path');

const snake = (key) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Convert a JSON row to a table row: camelCase -> snake_case, ISO strings -> Date. */
function toRow(obj, omit = []) {
  const row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (omit.includes(key)) continue;
    row[snake(key)] = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? new Date(value) : value;
  }
  return row;
}

function loadDemoData() {
  const file = path.resolve(__dirname, '../../data/helpdesk-db.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Tables in insert order (parents before children). */
const TABLES = [
  'users',
  'user_settings',
  'addresses',
  'categories',
  'pricing_rules',
  'provider_profiles',
  'provider_categories',
  'service_requests',
  'status_history',
  'cost_proposals',
  'messages',
  'reviews',
  'complaints',
  'notifications',
  'audit_logs',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const db = loadDemoData();
    const rows = {
      users: db.users.map((u) => toRow(u)),
      user_settings: db.userSettings.map((s) => ({
        user_id: s.userId,
        notify_booking_updates: s.notifications.bookingUpdates,
        notify_messages: s.notifications.messages,
        notify_promotions: s.notifications.promotions,
        language: s.language,
      })),
      addresses: db.addresses.map((a) => toRow(a)),
      categories: db.categories.map((c) => toRow(c)),
      pricing_rules: db.pricingRules.map((r) => toRow(r)),
      provider_profiles: db.providerProfiles.map((p) => toRow(p, ['categoryIds'])),
      provider_categories: db.providerProfiles.flatMap((p) => p.categoryIds.map((categoryId) => ({ provider_profile_id: p.id, category_id: categoryId }))),
      service_requests: db.serviceRequests.map((r) => toRow(r)),
      status_history: db.statusHistory.map((h) => toRow(h)),
      cost_proposals: db.costProposals.map((p) => toRow(p)),
      messages: db.messages.map((m) => toRow(m)),
      reviews: db.reviews.map((r) => toRow(r)),
      complaints: db.complaints.map((c) => toRow(c)),
      notifications: db.notifications.map((n) => toRow(n)),
      audit_logs: db.auditLogs.map((l) => toRow(l)),
    };

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of TABLES) {
        if (rows[table].length) await queryInterface.bulkInsert(table, rows[table], { transaction });
      }
      // Explicit ids were inserted, so move each sequence past the highest one.
      for (const table of TABLES) {
        if (table === 'user_settings' || table === 'provider_categories') continue;
        await queryInterface.sequelize.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false);`, { transaction });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of [...TABLES].reverse()) await queryInterface.bulkDelete(table, {}, { transaction });
    });
  },
};

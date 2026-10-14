/**
 * Sequelize database configuration — DRAFT, owned by Member 4 (Database).
 *
 * Used by both the backend (backend/src/models/index.js) and sequelize-cli
 * (via backend/.sequelizerc). Values come from environment variables only;
 * never hard-code credentials here.
 *
 * This file must not require any npm packages: it lives outside backend/ and
 * cannot see backend/node_modules. Environment variables are loaded by the caller.
 */
const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true, // createdAt -> created_at, userId -> user_id
  },
};

module.exports = {
  development: base,

  // Separate database so running tests never touches development data
  test: {
    ...base,
    database: process.env.DB_TEST_NAME,
  },

  // Render / AWS provide a single DATABASE_URL connection string
  production: process.env.DATABASE_URL
    ? {
        ...base,
        use_env_variable: 'DATABASE_URL',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      }
    : base,
};

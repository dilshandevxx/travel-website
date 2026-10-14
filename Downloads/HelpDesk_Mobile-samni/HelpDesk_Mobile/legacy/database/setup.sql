-- ==========================================================
-- One-time local setup — DRAFT, owned by Member 4 (Database)
--
-- Creates the application user and databases. Tables are NOT created here;
-- they come from the Sequelize migrations (npm run db:migrate in backend/).
--
-- Run as the postgres superuser:
--   psql -U postgres -f database/setup.sql
--
-- Replace the placeholder password locally before running and use the same
-- value for DB_PASSWORD in backend/.env. Never commit a real password.
-- ==========================================================

CREATE USER skilled_services_app WITH PASSWORD 'change_me';

CREATE DATABASE skilled_services_dev OWNER skilled_services_app;

-- Used only by `npm test`; the tests wipe it on every run
CREATE DATABASE skilled_services_test OWNER skilled_services_app;

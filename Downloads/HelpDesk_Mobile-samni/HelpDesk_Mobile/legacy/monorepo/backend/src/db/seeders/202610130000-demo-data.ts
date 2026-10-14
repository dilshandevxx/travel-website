// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Demo data seeder (categories, admin, sample customers/providers/bookings)
// TODO: Insert the 10 categories from @helpdesk/shared SERVICE_CATEGORIES plus demo users and bookings

import type { MigrationFn } from 'umzug';
import type { QueryInterface } from 'sequelize';

export const up: MigrationFn<QueryInterface> = async () => {
  console.log('demo-data seeder: nothing to insert yet');
};

export const down: MigrationFn<QueryInterface> = async () => {};

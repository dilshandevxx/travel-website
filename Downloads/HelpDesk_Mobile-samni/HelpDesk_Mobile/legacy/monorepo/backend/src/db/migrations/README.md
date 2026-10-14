# Migrations (Member 4)

One file per schema change, run in name order by `npm run db:migrate`.

- Name: `YYYYMMDDHHMM-description.ts`, e.g. `202610140900-create-users.ts`
- Each file exports `up` and `down`:

```ts
import type { MigrationFn } from 'umzug';
import type { QueryInterface } from 'sequelize';

export const up: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  /* createTable ... */
};
export const down: MigrationFn<QueryInterface> = async ({ context: qi }) => {
  /* dropTable ... */
};
```

Never edit a migration that has already been merged; add a new one instead.

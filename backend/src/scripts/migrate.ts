// Applies committed SQL migrations from ./drizzle. Safe to run repeatedly —
// drizzle records applied migrations in the __drizzle_migrations table.
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from '../db/index.js';
import { logger } from '../utils/logger.js';

migrate(db, { migrationsFolder: './drizzle' })
  .then(async () => {
    logger.info('Migrations applied successfully');
    await client.end({ timeout: 5 });
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Migration failed:', error);
    await client.end({ timeout: 5 });
    process.exit(1);
  });

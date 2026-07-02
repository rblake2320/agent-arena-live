import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/agent_arena_live';

// Disable prefetch as it's not supported for "Transaction" pool mode
export const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Export types for use throughout the application
export type Database = typeof db;
export * from './schema.js';
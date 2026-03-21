import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables for TypeORM CLI
config({ path: '.env' });
if (!process.env.DATABASE_URL) {
  config({ path: '.env.example' });
}

/**
 * TypeORM DataSource for CLI commands (migrations, etc.)
 * Used by:
 * - npm run migration:generate
 * - npm run migration:run
 * - npm run migration:revert
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/data/models/*.model.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false, // Never auto-sync with migrations
  logging: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

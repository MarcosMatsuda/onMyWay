import { DataSource } from 'typeorm';

/**
 * Truncate all tables in dependency order to avoid foreign key errors
 * Order: etas → locations → parents → schools
 */
export async function truncateTables(dataSource: DataSource): Promise<void> {
  const tables = ['etas', 'locations', 'parents', 'schools'];

  // Disable foreign key checks temporarily
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    // Truncate tables
    for (const table of tables) {
      await dataSource.query(`TRUNCATE TABLE ${table}`);
    }
  } finally {
    // Re-enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

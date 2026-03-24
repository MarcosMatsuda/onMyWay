import { DataSource } from 'typeorm';

export async function truncateTables(dataSource: DataSource): Promise<void> {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource is not initialized');
  }

  try {
    // Disable foreign key constraints temporarily
    await dataSource.query('SET session_replication_role = replica;');

    // Truncate tables in order of dependencies (reverse order of creation)
    const tables = ['etas', 'locations', 'parents', 'schools'];

    for (const table of tables) {
      await dataSource.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // Re-enable foreign key constraints
    await dataSource.query('SET session_replication_role = default;');
  } catch (error) {
    console.error('Error truncating tables:', error);
    throw error;
  }
}

export async function truncateAllTables(dataSource: DataSource): Promise<void> {
  await truncateTables(dataSource);
}

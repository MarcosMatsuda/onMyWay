import { DataSource } from 'typeorm';
import { SchoolModel } from '../../data/models/school.model';
import { DbHelper } from './db.helper';

export { AppHelper } from './app.helper';
export { DbHelper } from './db.helper';
export { SeedHelper } from './seed.helper';

/**
 * Utility function to truncate all tables for test cleanup
 */
export async function truncateTables(dataSource: DataSource): Promise<void> {
  const dbHelper = new DbHelper(dataSource);
  await dbHelper.truncateTables();
}

/**
 * Utility function to seed a test school
 */
export async function seedSchool(
  dataSource: DataSource,
  overrides?: Partial<SchoolModel>,
): Promise<SchoolModel> {
  const schoolRepo = dataSource.getRepository(SchoolModel);
  const school = schoolRepo.create({
    name: 'Test School',
    lat: -23.5505,
    lng: -46.6333,
    geofenceRadiusMeters: 1000,
    notificationThresholdMeters: 500,
    location: `SRID=4326;POINT(-46.6333 -23.5505)`,
    ...overrides,
  });
  return schoolRepo.save(school);
}

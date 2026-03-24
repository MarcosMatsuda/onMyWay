import { DataSource } from 'typeorm';

export async function seedSchool(dataSource: DataSource): Promise<any> {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource is not initialized');
  }

  const schoolRepository = dataSource.getRepository('School');

  const school = schoolRepository.create({
    name: 'Test School',
    lat: -23.5505,
    lng: -46.6333,
    geofenceRadiusMeters: 1000,
    notificationThresholdMeters: 500,
  });

  return schoolRepository.save(school);
}

export async function seedMultipleSchools(
  dataSource: DataSource,
  count: number = 3,
): Promise<any[]> {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource is not initialized');
  }

  const schoolRepository = dataSource.getRepository('School');
  const schools: any[] = [];

  for (let i = 0; i < count; i++) {
    const school = schoolRepository.create({
      name: `Test School ${i + 1}`,
      lat: -23.5505 + i * 0.01,
      lng: -46.6333 + i * 0.01,
      geofenceRadiusMeters: 1000,
      notificationThresholdMeters: 500,
    });

    const saved = await schoolRepository.save(school);
    schools.push(saved);
  }

  return schools;
}

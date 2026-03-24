import { DataSource } from 'typeorm';
import { School } from '../../domain/entities/school.entity';
import { v4 as uuid } from 'uuid';

/**
 * Seed a test school into the database
 * Returns the inserted school entity
 */
export async function seedSchool(dataSource: DataSource): Promise<School> {
  const schoolId = uuid();

  const schoolEntity = {
    id: schoolId,
    name: 'Test School',
    lat: -23.5505,
    lng: -46.6333,
    geofenceRadiusMeters: 1000,
    notificationThresholdMeters: 500,
    createdAt: new Date(),
  };

  await dataSource.query(
    `INSERT INTO schools (id, name, lat, lng, geofenceRadiusMeters, notificationThresholdMeters, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      schoolEntity.id,
      schoolEntity.name,
      schoolEntity.lat,
      schoolEntity.lng,
      schoolEntity.geofenceRadiusMeters,
      schoolEntity.notificationThresholdMeters,
      schoolEntity.createdAt,
    ],
  );

  return schoolEntity as School;
}

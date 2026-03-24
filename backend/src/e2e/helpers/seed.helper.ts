import { DataSource } from 'typeorm'
import { School } from '../../domain/entities/school.entity'

export class SeedHelper {
  static async seedTestSchool(dataSource: DataSource): Promise<School> {
    const schoolRepo = dataSource.getRepository(School)
    const school = schoolRepo.create({
      name: 'Test School',
      latitude: -23.5505,
      longitude: -46.6333,
    })
    return schoolRepo.save(school)
  }
}

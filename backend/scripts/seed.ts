import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SchoolModel } from '../src/data/models/school.model';
import { ParentModel } from '../src/data/models/parent.model';

/**
 * Database seed script for development and testing
 * Creates test school and parent with known credentials
 *
 * Prerequisites:
 *   - Database must be created (run migrations first)
 *   - Environment variables configured (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
 *
 * Usage:
 *   npm run seed           # Creates or skips if already exists (idempotent)
 *   npm run seed:reset     # Clears and reseeds test data
 *
 * Test Credentials (after running):
 *   Email: test@onmyway.dev
 *   Password: Test@1234
 */

const SEED_EMAIL = 'test@onmyway.dev';
const SEED_PASSWORD = 'Test@1234';
const SEED_SCHOOL_NAME = 'Escola Teste';
const SEED_SCHOOL_LAT = -23.5505;
const SEED_SCHOOL_LNG = -46.6333;

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'onmyway_dev',
    entities: [SchoolModel, ParentModel],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    console.log('🌱 Starting database seed...\n');

    // Check if seed already exists
    const existingParent = await dataSource
      .getRepository(ParentModel)
      .findOne({
        where: { email: SEED_EMAIL },
      });

    if (existingParent) {
      console.log(
        '✅ Seed already exists (idempotent). Skipping...\n',
      );
      console.log('📋 Existing Test Credentials:');
      console.log(`   Email: ${SEED_EMAIL}`);
      console.log(`   Password: ${SEED_PASSWORD}`);
      console.log(`   School ID: ${existingParent.schoolId}\n`);
      return;
    }

    // Create school
    const schoolRepository = dataSource.getRepository(SchoolModel);
    const school = schoolRepository.create({
      id: uuidv4(),
      name: SEED_SCHOOL_NAME,
      lat: SEED_SCHOOL_LAT,
      lng: SEED_SCHOOL_LNG,
      geofenceRadiusMeters: 1000,
      notificationThresholdMeters: 500,
      createdAt: new Date(),
    });

    const savedSchool = await schoolRepository.save(school);
    console.log(`✅ Created school: "${SEED_SCHOOL_NAME}"`);
    console.log(`   ID: ${savedSchool.id}`);
    console.log(`   Location: ${SEED_SCHOOL_LAT}, ${SEED_SCHOOL_LNG}\n`);

    // Create parent
    const parentRepository = dataSource.getRepository(ParentModel);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, salt);

    const parent = parentRepository.create({
      id: uuidv4(),
      name: 'João Teste',
      email: SEED_EMAIL,
      phone: '+5511987654321',
      schoolId: savedSchool.id,
      passwordHash,
      createdAt: new Date(),
    });

    const savedParent = await parentRepository.save(parent);
    console.log(`✅ Created parent: "João Teste"`);
    console.log(`   ID: ${savedParent.id}\n`);

    // Print credentials
    console.log('🔑 Test Credentials:');
    console.log(`   Email: ${SEED_EMAIL}`);
    console.log(`   Password: ${SEED_PASSWORD}`);
    console.log(`   School ID: ${savedSchool.id}\n`);

    console.log('📝 Quick Test Commands:');
    console.log(`   # Register & Login:`);
    console.log(`   curl -X POST http://localhost:3000/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(
      `     -d '{"email":"${SEED_EMAIL}","password":"${SEED_PASSWORD}"}'\n`,
    );
    console.log(`   # List schools:`);
    console.log(`   curl http://localhost:3000/schools\n`);

    console.log('✨ Database seed complete!\n');
  } catch (error) {
    console.error('❌ Seed failed:', error.message || error);
    console.error('\n⚠️  Make sure:');
    console.error('   1. Database is created: createdb onmyway_dev');
    console.error('   2. Migrations are run: npm run migration:run');
    console.error('   3. Environment variables are set (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)\n');
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

async function reset() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'onmyway_dev',
    entities: [SchoolModel, ParentModel],
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    console.log('🗑️  Resetting seed data...\n');

    // Delete existing test data
    const parentRepository = dataSource.getRepository(ParentModel);
    const schoolRepository = dataSource.getRepository(SchoolModel);

    const deletedParents = await parentRepository.delete({
      email: SEED_EMAIL,
    });
    console.log(`🗑️  Deleted ${deletedParents.affected} parent record(s)`);

    const deletedSchools = await schoolRepository.delete({
      name: SEED_SCHOOL_NAME,
    });
    console.log(`🗑️  Deleted ${deletedSchools.affected} school record(s)\n`);

    // Reseed
    await seed();
  } catch (error) {
    console.error('❌ Reset failed:', error.message || error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'reset') {
  reset().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  seed().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

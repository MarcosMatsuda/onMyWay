import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../src/infrastructure/database/data-source';

/**
 * Seed script for creating the first super-admin user
 *
 * Usage:
 *   SUPER_ADMIN_EMAIL=admin@example.com \
 *   SUPER_ADMIN_PASSWORD=SecurePassword123 \
 *   npx ts-node scripts/seed-super-admin.ts
 *
 * Reads environment variables:
 *   - SUPER_ADMIN_EMAIL (required)
 *   - SUPER_ADMIN_PASSWORD (required)
 *   - DATABASE_URL (uses .env if not set)
 *
 * Exits with code 0 on success, 1 on error
 */
async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD env vars are required',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const queryRunner = AppDataSource.createQueryRunner();

    // Check if user already exists
    const existingUser = await queryRunner.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (existingUser.length > 0) {
      console.log(
        `✓ Super-admin user with email "${email}" already exists. Skipping.`,
      );
      await queryRunner.release();
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert super-admin user
    await queryRunner.query(
      `INSERT INTO users (name, email, password_hash, role, school_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['Super Admin', email, passwordHash, 'super_admin', null, new Date()],
    );

    await queryRunner.release();

    console.log(`✓ Super-admin user created successfully!`);
    console.log(`  Email: ${email}`);
    console.log(`  Role: super_admin`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super-admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Create users table for multi-role admin authentication
 *
 * Stores admin users (super_admin and school_admin roles).
 * Separate from parents table to maintain clear domain separation.
 */
export class CreateUsersTable1711200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'school_admin'
          CHECK (role IN ('super_admin', 'school_admin')),
        "school_id" uuid REFERENCES "schools"("id") ON DELETE SET NULL,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX "IDX_users_email" ON "users" ("email");
      CREATE INDEX "IDX_users_school_id" ON "users" ("school_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_school_id";
      DROP INDEX IF EXISTS "IDX_users_email";
      DROP TABLE IF EXISTS "users";
    `);
  }
}

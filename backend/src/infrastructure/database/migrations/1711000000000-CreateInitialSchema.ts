import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial database schema migration
 * Creates all core tables: schools, parents, locations, etas
 * Enables PostGIS extension for geospatial queries
 */
export class CreateInitialSchema1711000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "postgis"');

    // Create schools table
    await queryRunner.query(`
      CREATE TABLE "schools" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "lat" numeric(10, 8) NOT NULL,
        "lng" numeric(11, 8) NOT NULL,
        "location" geometry(Point, 4326),
        "geofence_radius_meters" integer NOT NULL DEFAULT 1000,
        "notification_threshold_meters" integer NOT NULL DEFAULT 500,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create parents table
    await queryRunner.query(`
      CREATE TABLE "parents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL UNIQUE,
        "phone" character varying(20),
        "school_id" uuid NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on parents.school_id
    await queryRunner.query(
      `CREATE INDEX "IDX_parents_school_id" ON "parents" ("school_id")`,
    );

    // Create locations table
    await queryRunner.query(`
      CREATE TABLE "locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "parent_id" uuid NOT NULL,
        "lat" numeric(10, 8) NOT NULL,
        "lng" numeric(11, 8) NOT NULL,
        "point" geometry(Point, 4326),
        "accuracy" real,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on locations.parent_id
    await queryRunner.query(
      `CREATE INDEX "IDX_locations_parent_id" ON "locations" ("parent_id")`,
    );

    // Create etas table
    await queryRunner.query(`
      CREATE TABLE "etas" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "parent_id" uuid NOT NULL,
        "school_id" uuid NOT NULL,
        "distance_meters" integer NOT NULL,
        "duration_seconds" integer NOT NULL,
        "route_polyline" text NOT NULL,
        "calculated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes on etas
    await queryRunner.query(
      `CREATE INDEX "IDX_etas_parent_id" ON "etas" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_etas_school_id" ON "etas" ("school_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_etas_school_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_etas_parent_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "etas"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_locations_parent_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "locations"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_parents_school_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "parents"');

    await queryRunner.query('DROP TABLE IF EXISTS "schools"');

    // Drop PostGIS extension
    await queryRunner.query('DROP EXTENSION IF EXISTS "postgis"');
  }
}

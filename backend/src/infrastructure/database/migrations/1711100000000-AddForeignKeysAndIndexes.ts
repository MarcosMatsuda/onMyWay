import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add foreign key constraints and spatial indexes
 *
 * Changes:
 * - Add FK: parents.school_id → schools.id (ON DELETE CASCADE)
 * - Add FK: locations.parent_id → parents.id (ON DELETE CASCADE)
 * - Add FK: etas.parent_id → parents.id (ON DELETE CASCADE)
 * - Add GIST index on schools.location for spatial queries
 * - Add GIST index on locations.point for spatial queries
 * - Add composite index on locations(parent_id, timestamp DESC) for latest-per-parent queries
 */
export class AddForeignKeysAndIndexes1711100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key: parents.school_id → schools.id
    await queryRunner.query(`
      ALTER TABLE "parents"
      ADD CONSTRAINT "fk_parents_school_id"
      FOREIGN KEY ("school_id")
      REFERENCES "schools" ("id")
      ON DELETE CASCADE
    `);

    // Add foreign key: locations.parent_id → parents.id
    await queryRunner.query(`
      ALTER TABLE "locations"
      ADD CONSTRAINT "fk_locations_parent_id"
      FOREIGN KEY ("parent_id")
      REFERENCES "parents" ("id")
      ON DELETE CASCADE
    `);

    // Add foreign key: etas.parent_id → parents.id
    await queryRunner.query(`
      ALTER TABLE "etas"
      ADD CONSTRAINT "fk_etas_parent_id"
      FOREIGN KEY ("parent_id")
      REFERENCES "parents" ("id")
      ON DELETE CASCADE
    `);

    // Add GIST index on schools.location for spatial queries
    // This accelerates ST_Distance queries in findParentsWithinGeofence
    await queryRunner.query(`
      CREATE INDEX "IDX_schools_location_gist"
      ON "schools"
      USING GIST ("location")
    `);

    // Add GIST index on locations.point for spatial queries
    // This accelerates ST_Distance queries in geofence filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_locations_point_gist"
      ON "locations"
      USING GIST ("point")
    `);

    // Add composite index on locations(parent_id, timestamp DESC)
    // This accelerates the "get latest location per parent" pattern
    // Used in findLatestByParentId and findLatestBulkByParentIds
    await queryRunner.query(`
      CREATE INDEX "IDX_locations_parent_id_timestamp"
      ON "locations" ("parent_id" DESC, "timestamp" DESC)
    `);

    // Add composite index on etas(parent_id, calculated_at DESC)
    // This accelerates the "get latest ETA per parent" pattern
    // Used in findLatestByParentId and findLatestBulkByParentIds
    await queryRunner.query(`
      CREATE INDEX "IDX_etas_parent_id_calculated_at"
      ON "etas" ("parent_id" DESC, "calculated_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_etas_parent_id_calculated_at"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_locations_parent_id_timestamp"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_locations_point_gist"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_schools_location_gist"');

    // Drop foreign keys
    await queryRunner.query(
      'ALTER TABLE "etas" DROP CONSTRAINT IF EXISTS "fk_etas_parent_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "locations" DROP CONSTRAINT IF EXISTS "fk_locations_parent_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "parents" DROP CONSTRAINT IF EXISTS "fk_parents_school_id"',
    );
  }
}

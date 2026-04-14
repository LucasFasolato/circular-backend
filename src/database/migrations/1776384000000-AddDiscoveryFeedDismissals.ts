import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscoveryFeedDismissals1776384000000 implements MigrationInterface {
  name = 'AddDiscoveryFeedDismissals1776384000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feed_dismissals" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "listing_id" UUID NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_feed_dismissals" PRIMARY KEY ("id"),
        CONSTRAINT "uq_feed_dismissals_user_listing" UNIQUE ("user_id", "listing_id"),
        CONSTRAINT "fk_feed_dismissals_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_feed_dismissals_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_feed_dismissals_user_id"
      ON "feed_dismissals" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_feed_dismissals_listing_id"
      ON "feed_dismissals" ("listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_listings_user_id_created_at"
      ON "saved_listings" ("user_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_listings_listing_id"
      ON "saved_listings" ("listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_listings_published_feed"
      ON "listings" ("published_at" DESC, "id" DESC)
      WHERE "state" = 'PUBLISHED' AND "archived_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_listings_published_feed"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_saved_listings_listing_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_saved_listings_user_id_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_feed_dismissals_listing_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_feed_dismissals_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "feed_dismissals"`);
  }
}

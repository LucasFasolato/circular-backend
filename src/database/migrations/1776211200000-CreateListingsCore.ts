import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateListingsCore1776211200000 implements MigrationInterface {
  name = 'CreateListingsCore1776211200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "garments" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "owner_user_id" UUID NOT NULL,
        "category" VARCHAR(80) NOT NULL,
        "subcategory" VARCHAR(80),
        "size" VARCHAR(32) NOT NULL,
        "condition" VARCHAR(32) NOT NULL,
        "brand" VARCHAR(120),
        "color" VARCHAR(80),
        "material" VARCHAR(120),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_garments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_garments_owner_user" FOREIGN KEY ("owner_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_garments_owner_user_id"
      ON "garments" ("owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_garments_category_size"
      ON "garments" ("category", "size")
    `);

    await queryRunner.query(`
      CREATE TABLE "listings" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "owner_user_id" UUID NOT NULL,
        "garment_id" UUID NOT NULL,
        "state" VARCHAR NOT NULL,
        "description" TEXT,
        "allows_purchase" BOOLEAN NOT NULL DEFAULT FALSE,
        "allows_trade" BOOLEAN NOT NULL DEFAULT FALSE,
        "price_amount" INTEGER,
        "currency_code" CHAR(3) NOT NULL DEFAULT 'ARS',
        "city" VARCHAR(120) NOT NULL,
        "zone" VARCHAR(120),
        "quality_score" INTEGER,
        "dominant_photo_id" UUID,
        "reservation_expires_at" TIMESTAMPTZ,
        "published_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "archived_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_listings" PRIMARY KEY ("id"),
        CONSTRAINT "uq_listings_garment_id" UNIQUE ("garment_id"),
        CONSTRAINT "ck_listings_commercial_config"
          CHECK ("allows_purchase" = TRUE OR "allows_trade" = TRUE),
        CONSTRAINT "ck_listings_price_amount_non_negative"
          CHECK ("price_amount" IS NULL OR "price_amount" >= 0),
        CONSTRAINT "ck_listings_reserved_has_expiration"
          CHECK ("state" <> 'RESERVED' OR "reservation_expires_at" IS NOT NULL),
        CONSTRAINT "ck_listings_closed_has_closed_at"
          CHECK ("state" <> 'CLOSED' OR "closed_at" IS NOT NULL),
        CONSTRAINT "ck_listings_archived_has_archived_at"
          CHECK ("state" <> 'ARCHIVED' OR "archived_at" IS NOT NULL),
        CONSTRAINT "fk_listings_owner_user" FOREIGN KEY ("owner_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_listings_garment" FOREIGN KEY ("garment_id")
          REFERENCES "garments" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_listings_owner_user_id"
      ON "listings" ("owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_listings_state"
      ON "listings" ("state")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_listings_city_zone"
      ON "listings" ("city", "zone")
    `);

    await queryRunner.query(`
      CREATE TABLE "listing_photos" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "listing_id" UUID NOT NULL,
        "object_key" TEXT NOT NULL,
        "public_url" TEXT NOT NULL,
        "mime_type" VARCHAR(120) NOT NULL,
        "size_bytes" INTEGER NOT NULL,
        "width" INTEGER NOT NULL,
        "height" INTEGER NOT NULL,
        "position" INTEGER NOT NULL,
        "audit_status" VARCHAR NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_listing_photos" PRIMARY KEY ("id"),
        CONSTRAINT "uq_listing_photos_listing_position" UNIQUE ("listing_id", "position"),
        CONSTRAINT "ck_listing_photos_position_positive" CHECK ("position" >= 1),
        CONSTRAINT "ck_listing_photos_size_positive" CHECK ("size_bytes" > 0),
        CONSTRAINT "ck_listing_photos_dimensions_positive" CHECK ("width" > 0 AND "height" > 0),
        CONSTRAINT "fk_listing_photos_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "listings"
      ADD CONSTRAINT "fk_listings_dominant_photo"
      FOREIGN KEY ("dominant_photo_id")
      REFERENCES "listing_photos" ("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "listing_trade_preferences" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "listing_id" UUID NOT NULL,
        "desired_categories" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "desired_sizes" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "notes" VARCHAR(280),
        CONSTRAINT "pk_listing_trade_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "uq_listing_trade_preferences_listing_id" UNIQUE ("listing_id"),
        CONSTRAINT "fk_listing_trade_preferences_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "saved_listings" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "listing_id" UUID NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_saved_listings" PRIMARY KEY ("id"),
        CONSTRAINT "uq_saved_listings_user_listing" UNIQUE ("user_id", "listing_id"),
        CONSTRAINT "fk_saved_listings_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_saved_listings_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_listings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "listing_trade_preferences"`);
    await queryRunner.query(
      `ALTER TABLE "listings" DROP CONSTRAINT IF EXISTS "fk_listings_dominant_photo"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "listing_photos"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_listings_city_zone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_listings_state"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_listings_owner_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "listings"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_garments_category_size"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_garments_owner_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "garments"`);
  }
}

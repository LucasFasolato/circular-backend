import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModerationAndImageAudits1776297600000 implements MigrationInterface {
  name = 'CreateModerationAndImageAudits1776297600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "moderation_reviews" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "listing_id" UUID NOT NULL,
        "state" VARCHAR NOT NULL,
        "reasons" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "provider_summary" JSONB,
        "review_version" INTEGER NOT NULL DEFAULT 1,
        "started_at" TIMESTAMPTZ NOT NULL,
        "resolved_at" TIMESTAMPTZ,
        "superseded_at" TIMESTAMPTZ,
        "created_by_system" BOOLEAN NOT NULL DEFAULT TRUE,
        "resolved_by_user_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_moderation_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "fk_moderation_reviews_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_moderation_reviews_resolved_by_user" FOREIGN KEY ("resolved_by_user_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_moderation_reviews_listing_id"
      ON "moderation_reviews" ("listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_moderation_reviews_state"
      ON "moderation_reviews" ("state")
    `);

    await queryRunner.query(`
      CREATE TABLE "image_audits" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "listing_photo_id" UUID NOT NULL,
        "status" VARCHAR NOT NULL,
        "reasons" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "provider_name" VARCHAR(80),
        "provider_payload" JSONB,
        "audited_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_image_audits" PRIMARY KEY ("id"),
        CONSTRAINT "fk_image_audits_listing_photo" FOREIGN KEY ("listing_photo_id")
          REFERENCES "listing_photos" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_image_audits_listing_photo_id"
      ON "image_audits" ("listing_photo_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_image_audits_status"
      ON "image_audits" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_image_audits_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_image_audits_listing_photo_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "image_audits"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_moderation_reviews_state"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_moderation_reviews_listing_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "moderation_reviews"`);
  }
}

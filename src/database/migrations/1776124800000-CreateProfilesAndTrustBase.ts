import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilesAndTrustBase1776124800000 implements MigrationInterface {
  name = 'CreateProfilesAndTrustBase1776124800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public_profiles" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "first_name" VARCHAR(80) NOT NULL,
        "last_name" VARCHAR(80),
        "instagram_handle" VARCHAR(64),
        "city" VARCHAR(120) NOT NULL,
        "zone" VARCHAR(120),
        "bio" VARCHAR(280),
        "avatar_url" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_public_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "public_profiles_user_id_uq" UNIQUE ("user_id"),
        CONSTRAINT "fk_public_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_public_profiles_city_zone"
      ON "public_profiles" ("city", "zone")
    `);

    await queryRunner.query(`
      CREATE TABLE "trust_profiles" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "has_instagram" BOOLEAN NOT NULL DEFAULT FALSE,
        "instagram_verified" BOOLEAN NOT NULL DEFAULT FALSE,
        "manual_review_required" BOOLEAN NOT NULL DEFAULT FALSE,
        "restriction_flags" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_trust_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "trust_profiles_user_id_uq" UNIQUE ("user_id"),
        CONSTRAINT "fk_trust_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reach_zones" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "city" VARCHAR(120) NOT NULL,
        "zone" VARCHAR(120) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_reach_zones" PRIMARY KEY ("id"),
        CONSTRAINT "uq_reach_zones_user_city_zone" UNIQUE ("user_id", "city", "zone"),
        CONSTRAINT "fk_reach_zones_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reach_zones_user_id" ON "reach_zones" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_reach_zones_city_zone" ON "reach_zones" ("city", "zone")
    `);

    await queryRunner.query(`
      CREATE TABLE "reputation_profiles" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "completed_transactions_count" INTEGER NOT NULL DEFAULT 0,
        "successful_transactions_count" INTEGER NOT NULL DEFAULT 0,
        "failed_transactions_count" INTEGER NOT NULL DEFAULT 0,
        "cancelled_transactions_count" INTEGER NOT NULL DEFAULT 0,
        "success_rate" NUMERIC(5,4) NOT NULL DEFAULT 0,
        "avg_response_time_hours" NUMERIC(10,2),
        "last_recomputed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_reputation_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "reputation_profiles_user_id_uq" UNIQUE ("user_id"),
        CONSTRAINT "fk_reputation_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "public_profiles" (
        "id",
        "user_id",
        "first_name",
        "last_name",
        "instagram_handle",
        "city",
        "zone",
        "bio",
        "avatar_url",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        "u"."id",
        '',
        NULL,
        NULL,
        '',
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
      FROM "users" "u"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "public_profiles" "pp"
        WHERE "pp"."user_id" = "u"."id"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "trust_profiles" (
        "id",
        "user_id",
        "has_instagram",
        "instagram_verified",
        "manual_review_required",
        "restriction_flags",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        "u"."id",
        FALSE,
        FALSE,
        FALSE,
        '{}'::jsonb,
        NOW(),
        NOW()
      FROM "users" "u"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "trust_profiles" "tp"
        WHERE "tp"."user_id" = "u"."id"
      )
    `);

    await queryRunner.query(`
      INSERT INTO "reputation_profiles" (
        "id",
        "user_id",
        "completed_transactions_count",
        "successful_transactions_count",
        "failed_transactions_count",
        "cancelled_transactions_count",
        "success_rate",
        "avg_response_time_hours",
        "last_recomputed_at",
        "created_at",
        "updated_at"
      )
      SELECT
        gen_random_uuid(),
        "u"."id",
        0,
        0,
        0,
        0,
        0,
        NULL,
        NULL,
        NOW(),
        NOW()
      FROM "users" "u"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "reputation_profiles" "rp"
        WHERE "rp"."user_id" = "u"."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "reputation_profiles"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reach_zones_city_zone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reach_zones_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reach_zones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "trust_profiles"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_public_profiles_city_zone"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "public_profiles"`);
  }
}

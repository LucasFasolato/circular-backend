import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration — CirculAR backend
 *
 * Creates:
 *   - users          Core identity table
 *   - sessions       Persisted refresh-token sessions (replaces ephemeral JWT)
 *
 * Postgres 13+ is assumed; gen_random_uuid() is a built-in function that
 * requires no extension.
 */
export class CreateUsersAndSessions1776038400000 implements MigrationInterface {
  name = 'CreateUsersAndSessions1776038400000';

  // -------------------------------------------------------------------------
  // UP
  // -------------------------------------------------------------------------
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // users
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                UUID          NOT NULL DEFAULT gen_random_uuid(),
        "email"             VARCHAR(320)  NOT NULL,
        "password_hash"     VARCHAR       NOT NULL,
        "phone_e164"        VARCHAR(24)   NOT NULL,
        "is_phone_verified" BOOLEAN       NOT NULL DEFAULT FALSE,
        "status"            VARCHAR       NOT NULL DEFAULT 'ACTIVE',
        "created_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_users"            PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email"      UNIQUE ("email"),
        CONSTRAINT "uq_users_phone_e164" UNIQUE ("phone_e164")
      )
    `);

    // ------------------------------------------------------------------
    // sessions
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
        "user_id"             UUID          NOT NULL,
        "refresh_token_hash"  VARCHAR       NOT NULL,
        "device_info"         JSONB,
        "ip_address"          INET,
        "user_agent"          TEXT,
        "expires_at"          TIMESTAMPTZ   NOT NULL,
        "revoked_at"          TIMESTAMPTZ,
        "created_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        "updated_at"          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

        CONSTRAINT "pk_sessions"      PRIMARY KEY ("id"),
        CONSTRAINT "fk_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    // ------------------------------------------------------------------
    // Indexes on sessions
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_user_id"    ON "sessions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_sessions_expires_at" ON "sessions" ("expires_at")
    `);
  }

  // -------------------------------------------------------------------------
  // DOWN — revert in reverse dependency order
  // -------------------------------------------------------------------------
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}

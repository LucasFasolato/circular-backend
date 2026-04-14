import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReputationEntries1776729600000 implements MigrationInterface {
  name = 'CreateReputationEntries1776729600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reputation_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "match_session_id" uuid NOT NULL,
        "entry_type" varchar(40) NOT NULL,
        "is_success" boolean NOT NULL,
        "response_time_hours" numeric(10,2),
        "was_cancelled" boolean NOT NULL DEFAULT false,
        "notes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_reputation_entries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_reputation_entries_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reputation_entries_match_session"
          FOREIGN KEY ("match_session_id") REFERENCES "match_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "uq_reputation_entries_user_match_entry_type"
          UNIQUE ("user_id", "match_session_id", "entry_type")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reputation_entries_user_id"
      ON "reputation_entries" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reputation_entries_match_session_id"
      ON "reputation_entries" ("match_session_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reputation_entries_match_session_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_reputation_entries_user_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "reputation_entries"`);
  }
}

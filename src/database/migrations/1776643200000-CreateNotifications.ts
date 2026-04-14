import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1776643200000 implements MigrationInterface {
  name = 'CreateNotifications1776643200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "type" VARCHAR(80) NOT NULL,
        "state" VARCHAR(32) NOT NULL DEFAULT 'UNREAD',
        "title" VARCHAR(160) NOT NULL,
        "body" TEXT,
        "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "read_at" TIMESTAMPTZ,
        "archived_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id_created_at"
      ON "notifications" ("user_id", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id_state"
      ON "notifications" ("user_id", "state")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notifications_user_id_state"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_notifications_user_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}

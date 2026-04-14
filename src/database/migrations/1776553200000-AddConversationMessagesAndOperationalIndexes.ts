import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationMessagesAndOperationalIndexes1776553200000 implements MigrationInterface {
  name = 'AddConversationMessagesAndOperationalIndexes1776553200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "conversation_messages" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "conversation_thread_id" UUID NOT NULL,
        "sender_user_id" UUID,
        "message_type" VARCHAR(32) NOT NULL,
        "text_body" TEXT,
        "quick_action_code" VARCHAR(64),
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_conversation_messages" PRIMARY KEY ("id"),
        CONSTRAINT "ck_conversation_messages_text_body"
          CHECK ("message_type" <> 'TEXT' OR "text_body" IS NOT NULL),
        CONSTRAINT "ck_conversation_messages_quick_action_code"
          CHECK (
            "message_type" <> 'QUICK_ACTION' OR "quick_action_code" IS NOT NULL
          ),
        CONSTRAINT "ck_conversation_messages_system_sender"
          CHECK (
            "message_type" = 'SYSTEM' OR "sender_user_id" IS NOT NULL
          ),
        CONSTRAINT "fk_conversation_messages_thread" FOREIGN KEY ("conversation_thread_id")
          REFERENCES "conversation_threads" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_conversation_messages_sender_user" FOREIGN KEY ("sender_user_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_conversation_messages_thread_id_created_at"
      ON "conversation_messages" ("conversation_thread_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_conversation_messages_sender_user_id"
      ON "conversation_messages" ("sender_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_purchase_intents_owner_state_created_at"
      ON "purchase_intents" ("listing_owner_user_id", "state", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposals_owner_state_created_at"
      ON "trade_proposals" ("target_listing_owner_user_id", "state", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_owner_state_created_at"
      ON "match_sessions" ("owner_user_id", "state", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_counterparty_state_created_at"
      ON "match_sessions" ("counterparty_user_id", "state", "created_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_active_expiration"
      ON "match_sessions" ("state", "expires_at")
      WHERE "state" IN ('OPEN', 'ACTIVE')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_active_expiration"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_counterparty_state_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_owner_state_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposals_owner_state_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_purchase_intents_owner_state_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_conversation_messages_sender_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_conversation_messages_thread_id_created_at"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_messages"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInteractionsAndMatchesCore1776466800000 implements MigrationInterface {
  name = 'CreateInteractionsAndMatchesCore1776466800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "purchase_intents" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "listing_id" UUID NOT NULL,
        "buyer_user_id" UUID NOT NULL,
        "listing_owner_user_id" UUID NOT NULL,
        "state" VARCHAR(32) NOT NULL,
        "source" VARCHAR(40),
        "expires_at" TIMESTAMPTZ,
        "accepted_at" TIMESTAMPTZ,
        "rejected_at" TIMESTAMPTZ,
        "cancelled_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "resolved_by_user_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_purchase_intents" PRIMARY KEY ("id"),
        CONSTRAINT "ck_purchase_intents_buyer_not_owner"
          CHECK ("buyer_user_id" <> "listing_owner_user_id"),
        CONSTRAINT "fk_purchase_intents_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_purchase_intents_buyer_user" FOREIGN KEY ("buyer_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_purchase_intents_listing_owner_user" FOREIGN KEY ("listing_owner_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_purchase_intents_resolved_by_user" FOREIGN KEY ("resolved_by_user_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_purchase_intents_listing_id"
      ON "purchase_intents" ("listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_purchase_intents_buyer_user_id"
      ON "purchase_intents" ("buyer_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_purchase_intents_listing_owner_user_id"
      ON "purchase_intents" ("listing_owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_purchase_intents_state"
      ON "purchase_intents" ("state")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_purchase_intents_active_listing_buyer"
      ON "purchase_intents" ("listing_id", "buyer_user_id")
      WHERE "state" = 'ACTIVE'
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_proposals" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "target_listing_id" UUID NOT NULL,
        "proposer_user_id" UUID NOT NULL,
        "target_listing_owner_user_id" UUID NOT NULL,
        "state" VARCHAR(32) NOT NULL,
        "source" VARCHAR(40),
        "expires_at" TIMESTAMPTZ,
        "accepted_at" TIMESTAMPTZ,
        "rejected_at" TIMESTAMPTZ,
        "cancelled_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "resolved_by_user_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_trade_proposals" PRIMARY KEY ("id"),
        CONSTRAINT "ck_trade_proposals_proposer_not_owner"
          CHECK ("proposer_user_id" <> "target_listing_owner_user_id"),
        CONSTRAINT "fk_trade_proposals_target_listing" FOREIGN KEY ("target_listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_trade_proposals_proposer_user" FOREIGN KEY ("proposer_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_trade_proposals_target_listing_owner_user" FOREIGN KEY ("target_listing_owner_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_trade_proposals_resolved_by_user" FOREIGN KEY ("resolved_by_user_id")
          REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposals_target_listing_id"
      ON "trade_proposals" ("target_listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposals_proposer_user_id"
      ON "trade_proposals" ("proposer_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposals_target_listing_owner_user_id"
      ON "trade_proposals" ("target_listing_owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposals_state"
      ON "trade_proposals" ("state")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_trade_proposals_active_target_listing_proposer"
      ON "trade_proposals" ("target_listing_id", "proposer_user_id")
      WHERE "state" = 'ACTIVE'
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_proposal_items" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "trade_proposal_id" UUID NOT NULL,
        "proposed_listing_id" UUID NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_trade_proposal_items" PRIMARY KEY ("id"),
        CONSTRAINT "uq_trade_proposal_items_trade_proposal_listing"
          UNIQUE ("trade_proposal_id", "proposed_listing_id"),
        CONSTRAINT "fk_trade_proposal_items_trade_proposal" FOREIGN KEY ("trade_proposal_id")
          REFERENCES "trade_proposals" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_trade_proposal_items_proposed_listing" FOREIGN KEY ("proposed_listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposal_items_trade_proposal_id"
      ON "trade_proposal_items" ("trade_proposal_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_trade_proposal_items_proposed_listing_id"
      ON "trade_proposal_items" ("proposed_listing_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "match_sessions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "type" VARCHAR(32) NOT NULL,
        "state" VARCHAR(32) NOT NULL,
        "listing_id" UUID NOT NULL,
        "origin_purchase_intent_id" UUID,
        "origin_trade_proposal_id" UUID,
        "owner_user_id" UUID NOT NULL,
        "counterparty_user_id" UUID NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "completed_at" TIMESTAMPTZ,
        "failed_at" TIMESTAMPTZ,
        "cancelled_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "success_confirmed_by_owner_at" TIMESTAMPTZ,
        "success_confirmed_by_counterparty_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_match_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "ck_match_sessions_users_distinct"
          CHECK ("owner_user_id" <> "counterparty_user_id"),
        CONSTRAINT "ck_match_sessions_single_origin"
          CHECK (
            (CASE WHEN "origin_purchase_intent_id" IS NULL THEN 0 ELSE 1 END) +
            (CASE WHEN "origin_trade_proposal_id" IS NULL THEN 0 ELSE 1 END)
            = 1
          ),
        CONSTRAINT "ck_match_sessions_purchase_origin"
          CHECK ("type" <> 'PURCHASE' OR "origin_purchase_intent_id" IS NOT NULL),
        CONSTRAINT "ck_match_sessions_trade_origin"
          CHECK ("type" <> 'TRADE' OR "origin_trade_proposal_id" IS NOT NULL),
        CONSTRAINT "fk_match_sessions_listing" FOREIGN KEY ("listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_match_sessions_origin_purchase_intent" FOREIGN KEY ("origin_purchase_intent_id")
          REFERENCES "purchase_intents" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_match_sessions_origin_trade_proposal" FOREIGN KEY ("origin_trade_proposal_id")
          REFERENCES "trade_proposals" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_match_sessions_owner_user" FOREIGN KEY ("owner_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_match_sessions_counterparty_user" FOREIGN KEY ("counterparty_user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_listing_id"
      ON "match_sessions" ("listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_owner_user_id"
      ON "match_sessions" ("owner_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_counterparty_user_id"
      ON "match_sessions" ("counterparty_user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_state"
      ON "match_sessions" ("state")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_match_sessions_expires_at"
      ON "match_sessions" ("expires_at")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_match_sessions_active_listing"
      ON "match_sessions" ("listing_id")
      WHERE "state" IN ('OPEN', 'ACTIVE')
    `);

    await queryRunner.query(`
      CREATE TABLE "conversation_threads" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "match_session_id" UUID NOT NULL,
        "state" VARCHAR(32) NOT NULL,
        "restricted_at" TIMESTAMPTZ,
        "closed_at" TIMESTAMPTZ,
        "archived_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_conversation_threads" PRIMARY KEY ("id"),
        CONSTRAINT "uq_conversation_threads_match_session_id" UNIQUE ("match_session_id"),
        CONSTRAINT "fk_conversation_threads_match_session" FOREIGN KEY ("match_session_id")
          REFERENCES "match_sessions" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "proposed_listing_commitments" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "proposed_listing_id" UUID NOT NULL,
        "trade_proposal_id" UUID,
        "match_session_id" UUID,
        "state" VARCHAR(32) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "released_at" TIMESTAMPTZ,
        CONSTRAINT "pk_proposed_listing_commitments" PRIMARY KEY ("id"),
        CONSTRAINT "fk_proposed_listing_commitments_proposed_listing" FOREIGN KEY ("proposed_listing_id")
          REFERENCES "listings" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_proposed_listing_commitments_trade_proposal" FOREIGN KEY ("trade_proposal_id")
          REFERENCES "trade_proposals" ("id") ON DELETE SET NULL,
        CONSTRAINT "fk_proposed_listing_commitments_match_session" FOREIGN KEY ("match_session_id")
          REFERENCES "match_sessions" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_proposed_listing_commitments_proposed_listing_id"
      ON "proposed_listing_commitments" ("proposed_listing_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_proposed_listing_commitments_trade_proposal_id"
      ON "proposed_listing_commitments" ("trade_proposal_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_proposed_listing_commitments_match_session_id"
      ON "proposed_listing_commitments" ("match_session_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_proposed_listing_commitments_active_listing"
      ON "proposed_listing_commitments" ("proposed_listing_id")
      WHERE "state" IN ('RESERVED_FOR_PROPOSAL', 'COMMITTED_TO_MATCH')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_proposed_listing_commitments_active_listing"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_proposed_listing_commitments_match_session_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_proposed_listing_commitments_trade_proposal_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_proposed_listing_commitments_proposed_listing_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "proposed_listing_commitments"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_threads"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_match_sessions_active_listing"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_expires_at"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_match_sessions_state"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_counterparty_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_owner_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_match_sessions_listing_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "match_sessions"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposal_items_proposed_listing_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposal_items_trade_proposal_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "trade_proposal_items"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_trade_proposals_active_target_listing_proposer"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_trade_proposals_state"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposals_target_listing_owner_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposals_proposer_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_trade_proposals_target_listing_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "trade_proposals"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_purchase_intents_active_listing_buyer"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_purchase_intents_state"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_purchase_intents_listing_owner_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_purchase_intents_buyer_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_purchase_intents_listing_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_intents"`);
  }
}

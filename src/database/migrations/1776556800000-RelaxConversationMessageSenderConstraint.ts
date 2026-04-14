import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxConversationMessageSenderConstraint1776556800000 implements MigrationInterface {
  name = 'RelaxConversationMessageSenderConstraint1776556800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversation_messages"
      DROP CONSTRAINT IF EXISTS "ck_conversation_messages_system_sender"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversation_messages"
      ADD CONSTRAINT "ck_conversation_messages_system_sender"
      CHECK (
        "message_type" = 'SYSTEM' OR "sender_user_id" IS NOT NULL
      )
    `);
  }
}

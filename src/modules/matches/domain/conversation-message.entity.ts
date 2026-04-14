import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';
import { ConversationThreadEntity } from './conversation-thread.entity';

@Entity('conversation_messages')
@Index('idx_conversation_messages_thread_id_created_at', [
  'conversationThreadId',
  'createdAt',
])
@Index('idx_conversation_messages_sender_user_id', ['senderUserId'])
export class ConversationMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'conversation_thread_id' })
  conversationThreadId: string;

  @ManyToOne(() => ConversationThreadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_thread_id' })
  conversation: ConversationThreadEntity;

  @Column({ type: 'uuid', name: 'sender_user_id', nullable: true })
  senderUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_user_id' })
  senderUser: UserEntity | null;

  @Column({ type: 'varchar', length: 32, name: 'message_type' })
  messageType: string;

  @Column({ type: 'text', name: 'text_body', nullable: true })
  textBody: string | null;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'quick_action_code',
    nullable: true,
  })
  quickActionCode: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

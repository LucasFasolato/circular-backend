import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MatchSessionEntity } from './match-session.entity';
import { ConversationMessageEntity } from './conversation-message.entity';

@Entity('conversation_threads')
@Index('uq_conversation_threads_match_session_id', ['matchSessionId'], {
  unique: true,
})
export class ConversationThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'match_session_id' })
  matchSessionId: string;

  @OneToOne(
    () => MatchSessionEntity,
    (matchSession) => matchSession.conversationThread,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'match_session_id' })
  matchSession: MatchSessionEntity;

  @Column({ type: 'varchar', length: 32 })
  state: string;

  @Column({ type: 'timestamptz', name: 'restricted_at', nullable: true })
  restrictedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'archived_at', nullable: true })
  archivedAt: Date | null;

  @OneToMany(() => ConversationMessageEntity, (message) => message.conversation)
  messages: ConversationMessageEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

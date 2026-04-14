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
import { MatchSessionEntity } from '../../matches/domain/match-session.entity';

@Entity('reputation_entries')
@Index('idx_reputation_entries_user_id', ['userId'])
@Index('idx_reputation_entries_match_session_id', ['matchSessionId'])
@Index(
  'uq_reputation_entries_user_match_entry_type',
  ['userId', 'matchSessionId', 'entryType'],
  { unique: true },
)
export class ReputationEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'uuid', name: 'match_session_id' })
  matchSessionId: string;

  @ManyToOne(() => MatchSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_session_id' })
  matchSession: MatchSessionEntity;

  @Column({ type: 'varchar', length: 40, name: 'entry_type' })
  entryType: string;

  @Column({ type: 'boolean', name: 'is_success' })
  isSuccess: boolean;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'response_time_hours',
    nullable: true,
  })
  responseTimeHours: string | null;

  @Column({ type: 'boolean', name: 'was_cancelled', default: false })
  wasCancelled: boolean;

  @Column({ type: 'jsonb', default: {}, name: 'notes' })
  notes: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

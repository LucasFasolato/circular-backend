import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';

@Entity('reputation_profiles')
export class ReputationProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'integer', name: 'completed_transactions_count', default: 0 })
  completedTransactionsCount: number;

  @Column({
    type: 'integer',
    name: 'successful_transactions_count',
    default: 0,
  })
  successfulTransactionsCount: number;

  @Column({ type: 'integer', name: 'failed_transactions_count', default: 0 })
  failedTransactionsCount: number;

  @Column({ type: 'integer', name: 'cancelled_transactions_count', default: 0 })
  cancelledTransactionsCount: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 4,
    name: 'success_rate',
    default: 0,
  })
  successRate: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'avg_response_time_hours',
    nullable: true,
  })
  avgResponseTimeHours: string | null;

  @Column({
    type: 'timestamptz',
    name: 'last_recomputed_at',
    nullable: true,
  })
  lastRecomputedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

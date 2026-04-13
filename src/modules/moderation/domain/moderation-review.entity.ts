import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { ModerationReason } from './moderation-reason.interface';

@Entity('moderation_reviews')
@Index('idx_moderation_reviews_listing_id', ['listingId'])
@Index('idx_moderation_reviews_state', ['state'])
export class ModerationReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({ type: 'varchar' })
  state: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  reasons: ModerationReason[];

  @Column({ type: 'jsonb', name: 'provider_summary', nullable: true })
  providerSummary: Record<string, unknown> | null;

  @Column({ type: 'integer', name: 'review_version', default: 1 })
  reviewVersion: number;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'superseded_at', nullable: true })
  supersededAt: Date | null;

  @Column({ type: 'boolean', name: 'created_by_system', default: true })
  createdBySystem: boolean;

  @Column({ type: 'uuid', name: 'resolved_by_user_id', nullable: true })
  resolvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedByUser: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { TradeProposalItemEntity } from './trade-proposal-item.entity';

@Entity('trade_proposals')
@Index('idx_trade_proposals_target_listing_id', ['targetListingId'])
@Index('idx_trade_proposals_proposer_user_id', ['proposerUserId'])
@Index('idx_trade_proposals_target_listing_owner_user_id', [
  'targetListingOwnerUserId',
])
@Index('idx_trade_proposals_state', ['state'])
@Index(
  'uq_trade_proposals_active_target_listing_proposer',
  ['targetListingId', 'proposerUserId'],
  {
    unique: true,
    where: `"state" = 'ACTIVE'`,
  },
)
export class TradeProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'target_listing_id' })
  targetListingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_listing_id' })
  targetListing: ListingEntity;

  @Column({ type: 'uuid', name: 'proposer_user_id' })
  proposerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposer_user_id' })
  proposerUser: UserEntity;

  @Column({ type: 'uuid', name: 'target_listing_owner_user_id' })
  targetListingOwnerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_listing_owner_user_id' })
  targetListingOwnerUser: UserEntity;

  @Column({ type: 'varchar', length: 32 })
  state: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  source: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'rejected_at', nullable: true })
  rejectedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'uuid', name: 'resolved_by_user_id', nullable: true })
  resolvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedByUser: UserEntity | null;

  @OneToMany(() => TradeProposalItemEntity, (item) => item.tradeProposal)
  items: TradeProposalItemEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

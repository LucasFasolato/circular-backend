import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { PurchaseIntentEntity } from './purchase-intent.entity';
import { TradeProposalEntity } from './trade-proposal.entity';
import { ConversationThreadEntity } from './conversation-thread.entity';

@Entity('match_sessions')
@Index('idx_match_sessions_listing_id', ['listingId'])
@Index('idx_match_sessions_owner_user_id', ['ownerUserId'])
@Index('idx_match_sessions_counterparty_user_id', ['counterpartyUserId'])
@Index('idx_match_sessions_state', ['state'])
@Index('idx_match_sessions_expires_at', ['expiresAt'])
@Index('uq_match_sessions_active_listing', ['listingId'], {
  unique: true,
  where: `"state" IN ('OPEN', 'ACTIVE')`,
})
export class MatchSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  type: string;

  @Column({ type: 'varchar', length: 32 })
  state: string;

  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({ type: 'uuid', name: 'origin_purchase_intent_id', nullable: true })
  originPurchaseIntentId: string | null;

  @ManyToOne(() => PurchaseIntentEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'origin_purchase_intent_id' })
  originPurchaseIntent: PurchaseIntentEntity | null;

  @Column({ type: 'uuid', name: 'origin_trade_proposal_id', nullable: true })
  originTradeProposalId: string | null;

  @ManyToOne(() => TradeProposalEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'origin_trade_proposal_id' })
  originTradeProposal: TradeProposalEntity | null;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: UserEntity;

  @Column({ type: 'uuid', name: 'counterparty_user_id' })
  counterpartyUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'counterparty_user_id' })
  counterpartyUser: UserEntity;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'failed_at', nullable: true })
  failedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @Column({
    type: 'timestamptz',
    name: 'success_confirmed_by_owner_at',
    nullable: true,
  })
  successConfirmedByOwnerAt: Date | null;

  @Column({
    type: 'timestamptz',
    name: 'success_confirmed_by_counterparty_at',
    nullable: true,
  })
  successConfirmedByCounterpartyAt: Date | null;

  @OneToOne(() => ConversationThreadEntity, (thread) => thread.matchSession)
  conversationThread: ConversationThreadEntity | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

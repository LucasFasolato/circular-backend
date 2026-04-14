import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { MatchSessionEntity } from './match-session.entity';
import { TradeProposalEntity } from './trade-proposal.entity';

@Entity('proposed_listing_commitments')
@Index('idx_proposed_listing_commitments_proposed_listing_id', [
  'proposedListingId',
])
@Index('idx_proposed_listing_commitments_trade_proposal_id', [
  'tradeProposalId',
])
@Index('idx_proposed_listing_commitments_match_session_id', ['matchSessionId'])
@Index(
  'uq_proposed_listing_commitments_active_listing',
  ['proposedListingId'],
  {
    unique: true,
    where: `"state" IN ('RESERVED_FOR_PROPOSAL', 'COMMITTED_TO_MATCH')`,
  },
)
export class ProposedListingCommitmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'proposed_listing_id' })
  proposedListingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposed_listing_id' })
  proposedListing: ListingEntity;

  @Column({ type: 'uuid', name: 'trade_proposal_id', nullable: true })
  tradeProposalId: string | null;

  @ManyToOne(() => TradeProposalEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trade_proposal_id' })
  tradeProposal: TradeProposalEntity | null;

  @Column({ type: 'uuid', name: 'match_session_id', nullable: true })
  matchSessionId: string | null;

  @ManyToOne(() => MatchSessionEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'match_session_id' })
  matchSession: MatchSessionEntity | null;

  @Column({ type: 'varchar', length: 32 })
  state: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', name: 'released_at', nullable: true })
  releasedAt: Date | null;
}

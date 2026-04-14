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
import { TradeProposalEntity } from './trade-proposal.entity';

@Entity('trade_proposal_items')
@Index('idx_trade_proposal_items_trade_proposal_id', ['tradeProposalId'])
@Index('idx_trade_proposal_items_proposed_listing_id', ['proposedListingId'])
@Index(
  'uq_trade_proposal_items_trade_proposal_listing',
  ['tradeProposalId', 'proposedListingId'],
  {
    unique: true,
  },
)
export class TradeProposalItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'trade_proposal_id' })
  tradeProposalId: string;

  @ManyToOne(
    () => TradeProposalEntity,
    (tradeProposal) => tradeProposal.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'trade_proposal_id' })
  tradeProposal: TradeProposalEntity;

  @Column({ type: 'uuid', name: 'proposed_listing_id' })
  proposedListingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proposed_listing_id' })
  proposedListing: ListingEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}

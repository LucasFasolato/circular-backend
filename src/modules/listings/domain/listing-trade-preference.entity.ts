import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ListingEntity } from './listing.entity';

@Entity('listing_trade_preferences')
export class ListingTradePreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'listing_id', unique: true })
  listingId: string;

  @OneToOne(() => ListingEntity, (listing) => listing.tradePreference, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({
    type: 'jsonb',
    name: 'desired_categories',
    default: () => "'[]'",
  })
  desiredCategories: string[];

  @Column({
    type: 'jsonb',
    name: 'desired_sizes',
    default: () => "'[]'",
  })
  desiredSizes: string[];

  @Column({ type: 'varchar', length: 280, nullable: true })
  notes: string | null;
}

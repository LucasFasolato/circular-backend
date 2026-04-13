import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';
import { GarmentEntity } from './garment.entity';
import { ListingPhotoEntity } from './listing-photo.entity';
import { ListingTradePreferenceEntity } from './listing-trade-preference.entity';
import { SavedListingEntity } from './saved-listing.entity';

@Entity('listings')
@Index('idx_listings_owner_user_id', ['ownerUserId'])
@Index('idx_listings_state', ['state'])
@Index('idx_listings_city_zone', ['city', 'zone'])
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: UserEntity;

  @Column({ type: 'uuid', name: 'garment_id', unique: true })
  garmentId: string;

  @OneToOne(() => GarmentEntity, (garment) => garment.listing, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'garment_id' })
  garment: GarmentEntity;

  @Column({ type: 'varchar' })
  state: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', name: 'allows_purchase', default: false })
  allowsPurchase: boolean;

  @Column({ type: 'boolean', name: 'allows_trade', default: false })
  allowsTrade: boolean;

  @Column({ type: 'integer', name: 'price_amount', nullable: true })
  priceAmount: number | null;

  @Column({ type: 'char', length: 3, name: 'currency_code', default: 'ARS' })
  currencyCode: string;

  @Column({ type: 'varchar', length: 120 })
  city: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  zone: string | null;

  @Column({ type: 'integer', name: 'quality_score', nullable: true })
  qualityScore: number | null;

  @Column({ type: 'uuid', name: 'dominant_photo_id', nullable: true })
  dominantPhotoId: string | null;

  @OneToOne(() => ListingPhotoEntity, { nullable: true })
  @JoinColumn({ name: 'dominant_photo_id' })
  dominantPhoto: ListingPhotoEntity | null;

  @Column({
    type: 'timestamptz',
    name: 'reservation_expires_at',
    nullable: true,
  })
  reservationExpiresAt: Date | null;

  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'closed_at', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'archived_at', nullable: true })
  archivedAt: Date | null;

  @OneToMany(() => ListingPhotoEntity, (photo) => photo.listing)
  photos: ListingPhotoEntity[];

  @OneToOne(
    () => ListingTradePreferenceEntity,
    (tradePreference) => tradePreference.listing,
  )
  tradePreference: ListingTradePreferenceEntity | null;

  @OneToMany(() => SavedListingEntity, (savedListing) => savedListing.listing)
  savedListings: SavedListingEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

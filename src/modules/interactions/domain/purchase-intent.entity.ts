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

@Entity('purchase_intents')
@Index('idx_purchase_intents_listing_id', ['listingId'])
@Index('idx_purchase_intents_buyer_user_id', ['buyerUserId'])
@Index('idx_purchase_intents_listing_owner_user_id', ['listingOwnerUserId'])
@Index('idx_purchase_intents_state', ['state'])
@Index(
  'uq_purchase_intents_active_listing_buyer',
  ['listingId', 'buyerUserId'],
  {
    unique: true,
    where: `"state" = 'ACTIVE'`,
  },
)
export class PurchaseIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @ManyToOne(() => ListingEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({ type: 'uuid', name: 'buyer_user_id' })
  buyerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_user_id' })
  buyerUser: UserEntity;

  @Column({ type: 'uuid', name: 'listing_owner_user_id' })
  listingOwnerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_owner_user_id' })
  listingOwnerUser: UserEntity;

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

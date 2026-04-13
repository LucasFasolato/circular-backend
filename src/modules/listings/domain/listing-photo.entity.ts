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
import { ListingEntity } from './listing.entity';

@Entity('listing_photos')
@Index('uq_listing_photos_listing_position', ['listingId', 'position'], {
  unique: true,
})
export class ListingPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @ManyToOne(() => ListingEntity, (listing) => listing.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @Column({ type: 'text', name: 'object_key' })
  objectKey: string;

  @Column({ type: 'text', name: 'public_url' })
  publicUrl: string;

  @Column({ type: 'varchar', length: 120, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'integer', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ type: 'integer' })
  width: number;

  @Column({ type: 'integer' })
  height: number;

  @Column({ type: 'integer' })
  position: number;

  @Column({ type: 'varchar', name: 'audit_status', default: 'PENDING' })
  auditStatus: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

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
import { ListingPhotoEntity } from '../../listings/domain/listing-photo.entity';
import { ModerationReason } from './moderation-reason.interface';

@Entity('image_audits')
@Index('idx_image_audits_listing_photo_id', ['listingPhotoId'])
@Index('idx_image_audits_status', ['status'])
export class ImageAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'listing_photo_id' })
  listingPhotoId: string;

  @ManyToOne(() => ListingPhotoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_photo_id' })
  listingPhoto: ListingPhotoEntity;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  reasons: ModerationReason[];

  @Column({
    type: 'varchar',
    length: 80,
    name: 'provider_name',
    nullable: true,
  })
  providerName: string | null;

  @Column({ type: 'jsonb', name: 'provider_payload', nullable: true })
  providerPayload: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', name: 'audited_at', nullable: true })
  auditedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

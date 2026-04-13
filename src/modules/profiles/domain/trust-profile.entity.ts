import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/domain/user.entity';

@Entity('trust_profiles')
export class TrustProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'boolean', name: 'has_instagram', default: false })
  hasInstagram: boolean;

  @Column({ type: 'boolean', name: 'instagram_verified', default: false })
  instagramVerified: boolean;

  @Column({ type: 'boolean', name: 'manual_review_required', default: false })
  manualReviewRequired: boolean;

  @Column({
    type: 'jsonb',
    name: 'restriction_flags',
    default: () => "'{}'",
  })
  restrictionFlags: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

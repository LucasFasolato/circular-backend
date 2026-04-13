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
import { ListingEntity } from './listing.entity';

@Entity('garments')
@Index('idx_garments_owner_user_id', ['ownerUserId'])
@Index('idx_garments_category_size', ['category', 'size'])
export class GarmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser: UserEntity;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  subcategory: string | null;

  @Column({ type: 'varchar', length: 32 })
  size: string;

  @Column({ type: 'varchar', length: 32 })
  condition: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  color: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  material: string | null;

  @OneToOne(() => ListingEntity, (listing) => listing.garment)
  listing: ListingEntity;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

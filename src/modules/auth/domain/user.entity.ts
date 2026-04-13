import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 24, unique: true, name: 'phone_e164' })
  phoneE164: string;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_phone_verified',
  })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status: UserStatus;

  @OneToMany(() => SessionEntity, (session) => session.user, {
    cascade: true,
  })
  sessions: SessionEntity[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { RefreshTokenEntity } from '../domain/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  async create(data: Partial<RefreshTokenEntity>): Promise<RefreshTokenEntity> {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user'],
    });
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
  }

  async revokeById(id: string): Promise<void> {
    await this.repo.update({ id }, { isRevoked: true });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { SessionEntity } from '../domain/session.entity';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repo: Repository<SessionEntity>,
  ) {}

  async create(data: Partial<SessionEntity>): Promise<SessionEntity> {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }

  /**
   * Find an active (non-revoked, non-expired) session by its hashed token,
   * loading the associated user for auth checks.
   */
  async findActiveByTokenHash(
    refreshTokenHash: string,
  ): Promise<SessionEntity | null> {
    return this.repo.findOne({
      where: {
        refreshTokenHash,
        revokedAt: IsNull(),
      },
      relations: ['user'],
    });
  }

  /**
   * Revoke all active sessions belonging to a user (logout everywhere).
   */
  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({ revokedAt: () => 'NOW()' })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  /**
   * Revoke a single session by its primary key (token rotation on refresh).
   */
  async revokeById(id: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(SessionEntity)
      .set({ revokedAt: () => 'NOW()' })
      .where('id = :id', { id })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  /**
   * Hard-delete sessions that have already expired (maintenance cleanup).
   */
  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}

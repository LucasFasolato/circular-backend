import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MatchSessionEntity } from '../domain/match-session.entity';
import { MatchSessionState } from '../domain/match-session-state.enum';

@Injectable()
export class MatchSessionRepository {
  constructor(
    @InjectRepository(MatchSessionEntity)
    private readonly repo: Repository<MatchSessionEntity>,
  ) {}

  async create(
    data: Partial<MatchSessionEntity>,
    manager?: EntityManager,
  ): Promise<MatchSessionEntity> {
    const repo = manager
      ? manager.getRepository(MatchSessionEntity)
      : this.repo;
    return repo.save(repo.create(data));
  }

  async save(
    entity: MatchSessionEntity,
    manager?: EntityManager,
  ): Promise<MatchSessionEntity> {
    const repo = manager
      ? manager.getRepository(MatchSessionEntity)
      : this.repo;
    return repo.save(entity);
  }

  async findActiveByListingId(
    listingId: string,
    manager?: EntityManager,
  ): Promise<MatchSessionEntity | null> {
    const repo = manager
      ? manager.getRepository(MatchSessionEntity)
      : this.repo;
    return repo.findOne({
      where: [
        { listingId, state: MatchSessionState.OPEN },
        { listingId, state: MatchSessionState.ACTIVE },
      ],
    });
  }

  async hasActiveByListingIds(
    listingIds: string[],
    manager?: EntityManager,
  ): Promise<boolean> {
    if (listingIds.length === 0) {
      return false;
    }

    const repo = manager
      ? manager.getRepository(MatchSessionEntity)
      : this.repo;
    const count = await repo
      .createQueryBuilder('matchSession')
      .where('matchSession.listing_id IN (:...listingIds)', { listingIds })
      .andWhere('matchSession.state IN (:...states)', {
        states: [MatchSessionState.OPEN, MatchSessionState.ACTIVE],
      })
      .getCount();

    return count > 0;
  }

  async findByIdForUpdate(
    matchSessionId: string,
    manager: EntityManager,
  ): Promise<MatchSessionEntity | null> {
    return manager
      .getRepository(MatchSessionEntity)
      .createQueryBuilder('matchSession')
      .setLock('pessimistic_write')
      .where('matchSession.id = :matchSessionId', { matchSessionId })
      .getOne();
  }

  async findExpiredActiveIds(now: Date, limit = 100): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('matchSession')
      .select('matchSession.id', 'id')
      .where('matchSession.state IN (:...states)', {
        states: [MatchSessionState.OPEN, MatchSessionState.ACTIVE],
      })
      .andWhere('matchSession.expires_at <= :now', { now: now.toISOString() })
      .orderBy('matchSession.expires_at', 'ASC')
      .addOrderBy('matchSession.id', 'ASC')
      .take(limit)
      .getRawMany<{ id: string }>();

    return rows.map((row) => row.id);
  }
}

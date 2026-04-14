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
    const entity = repo.create(data);
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
}

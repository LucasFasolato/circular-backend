import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReputationProfileEntity } from '../domain/reputation-profile.entity';

@Injectable()
export class ReputationProfileRepository {
  constructor(
    @InjectRepository(ReputationProfileEntity)
    private readonly repo: Repository<ReputationProfileEntity>,
  ) {}

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<ReputationProfileEntity | null> {
    const repo = manager
      ? manager.getRepository(ReputationProfileEntity)
      : this.repo;
    return repo.findOne({ where: { userId } });
  }

  async create(
    data: Partial<ReputationProfileEntity>,
    manager?: EntityManager,
  ): Promise<ReputationProfileEntity> {
    const repo = manager
      ? manager.getRepository(ReputationProfileEntity)
      : this.repo;
    const profile = repo.create(data);
    return repo.save(profile);
  }
}

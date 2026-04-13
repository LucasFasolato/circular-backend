import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TrustProfileEntity } from '../domain/trust-profile.entity';

@Injectable()
export class TrustProfileRepository {
  constructor(
    @InjectRepository(TrustProfileEntity)
    private readonly repo: Repository<TrustProfileEntity>,
  ) {}

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<TrustProfileEntity | null> {
    const repo = manager
      ? manager.getRepository(TrustProfileEntity)
      : this.repo;
    return repo.findOne({ where: { userId } });
  }

  async create(
    data: Partial<TrustProfileEntity>,
    manager?: EntityManager,
  ): Promise<TrustProfileEntity> {
    const repo = manager
      ? manager.getRepository(TrustProfileEntity)
      : this.repo;
    const profile = repo.create(data);
    return repo.save(profile);
  }

  async save(
    profile: TrustProfileEntity,
    manager?: EntityManager,
  ): Promise<TrustProfileEntity> {
    const repo = manager
      ? manager.getRepository(TrustProfileEntity)
      : this.repo;
    return repo.save(profile);
  }
}

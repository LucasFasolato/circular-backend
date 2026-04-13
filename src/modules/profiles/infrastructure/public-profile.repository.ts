import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PublicProfileEntity } from '../domain/public-profile.entity';

@Injectable()
export class PublicProfileRepository {
  constructor(
    @InjectRepository(PublicProfileEntity)
    private readonly repo: Repository<PublicProfileEntity>,
  ) {}

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<PublicProfileEntity | null> {
    const repo = manager
      ? manager.getRepository(PublicProfileEntity)
      : this.repo;
    return repo.findOne({ where: { userId } });
  }

  async create(
    data: Partial<PublicProfileEntity>,
    manager?: EntityManager,
  ): Promise<PublicProfileEntity> {
    const repo = manager
      ? manager.getRepository(PublicProfileEntity)
      : this.repo;
    const profile = repo.create(data);
    return repo.save(profile);
  }

  async save(
    profile: PublicProfileEntity,
    manager?: EntityManager,
  ): Promise<PublicProfileEntity> {
    const repo = manager
      ? manager.getRepository(PublicProfileEntity)
      : this.repo;
    return repo.save(profile);
  }
}

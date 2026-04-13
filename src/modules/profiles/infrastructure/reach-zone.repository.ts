import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReachZoneEntity } from '../domain/reach-zone.entity';

interface ReachZoneInput {
  city: string;
  zone: string;
}

@Injectable()
export class ReachZoneRepository {
  constructor(
    @InjectRepository(ReachZoneEntity)
    private readonly repo: Repository<ReachZoneEntity>,
  ) {}

  async findByUserId(userId: string): Promise<ReachZoneEntity[]> {
    return this.repo.find({
      where: { userId },
      order: {
        city: 'ASC',
        zone: 'ASC',
      },
    });
  }

  async replaceForUser(
    userId: string,
    zones: ReachZoneInput[],
    manager?: EntityManager,
  ): Promise<ReachZoneEntity[]> {
    const repo = manager ? manager.getRepository(ReachZoneEntity) : this.repo;

    await repo.delete({ userId });

    if (zones.length === 0) {
      return [];
    }

    const entities = zones.map((zone) =>
      repo.create({
        userId,
        city: zone.city,
        zone: zone.zone,
      }),
    );

    return repo.save(entities);
  }
}

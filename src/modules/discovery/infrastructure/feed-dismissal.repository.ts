import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { FeedDismissalEntity } from '../domain/feed-dismissal.entity';

@Injectable()
export class FeedDismissalRepository {
  constructor(
    @InjectRepository(FeedDismissalEntity)
    private readonly repo: Repository<FeedDismissalEntity>,
  ) {}

  async createIfMissing(
    userId: string,
    listingId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager
      ? manager.getRepository(FeedDismissalEntity)
      : this.repo;
    const result = await repo
      .createQueryBuilder()
      .insert()
      .into(FeedDismissalEntity)
      .values({ userId, listingId })
      .orIgnore()
      .execute();

    return (result.identifiers?.length ?? 0) > 0;
  }

  async exists(userId: string, listingId: string): Promise<boolean> {
    const dismissal = await this.repo.findOne({
      where: { userId, listingId },
      select: ['id'],
    });

    return dismissal !== null;
  }
}

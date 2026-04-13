import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Not, Repository } from 'typeorm';
import { ModerationReviewEntity } from '../domain/moderation-review.entity';
import { ModerationReviewState } from '../domain/moderation-review-state.enum';

@Injectable()
export class ModerationReviewRepository {
  constructor(
    @InjectRepository(ModerationReviewEntity)
    private readonly repo: Repository<ModerationReviewEntity>,
  ) {}

  async create(
    data: Partial<ModerationReviewEntity>,
    manager?: EntityManager,
  ): Promise<ModerationReviewEntity> {
    const repo = manager
      ? manager.getRepository(ModerationReviewEntity)
      : this.repo;
    const review = repo.create(data);
    return repo.save(review);
  }

  async save(
    review: ModerationReviewEntity,
    manager?: EntityManager,
  ): Promise<ModerationReviewEntity> {
    const repo = manager
      ? manager.getRepository(ModerationReviewEntity)
      : this.repo;
    return repo.save(review);
  }

  async findLatestByListingId(
    listingId: string,
    manager?: EntityManager,
  ): Promise<ModerationReviewEntity | null> {
    const repo = manager
      ? manager.getRepository(ModerationReviewEntity)
      : this.repo;
    return repo.findOne({
      where: { listingId },
      order: {
        reviewVersion: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findLatestRelevantByListingId(
    listingId: string,
    manager?: EntityManager,
  ): Promise<ModerationReviewEntity | null> {
    const repo = manager
      ? manager.getRepository(ModerationReviewEntity)
      : this.repo;
    return repo.findOne({
      where: {
        listingId,
        supersededAt: IsNull(),
        state: Not(ModerationReviewState.SUPERSEDED),
      },
      order: {
        reviewVersion: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async findAllByListingId(
    listingId: string,
  ): Promise<ModerationReviewEntity[]> {
    return this.repo.find({
      where: { listingId },
      order: {
        reviewVersion: 'DESC',
        createdAt: 'DESC',
      },
    });
  }
}

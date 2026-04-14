import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PurchaseIntentEntity } from '../domain/purchase-intent.entity';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';

@Injectable()
export class PurchaseIntentRepository {
  constructor(
    @InjectRepository(PurchaseIntentEntity)
    private readonly repo: Repository<PurchaseIntentEntity>,
  ) {}

  async create(
    data: Partial<PurchaseIntentEntity>,
    manager?: EntityManager,
  ): Promise<PurchaseIntentEntity> {
    const repo = manager
      ? manager.getRepository(PurchaseIntentEntity)
      : this.repo;
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async save(
    entity: PurchaseIntentEntity,
    manager?: EntityManager,
  ): Promise<PurchaseIntentEntity> {
    const repo = manager
      ? manager.getRepository(PurchaseIntentEntity)
      : this.repo;
    return repo.save(entity);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<PurchaseIntentEntity | null> {
    const repo = manager
      ? manager.getRepository(PurchaseIntentEntity)
      : this.repo;
    return repo.findOne({ where: { id } });
  }

  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<PurchaseIntentEntity | null> {
    return manager
      .getRepository(PurchaseIntentEntity)
      .createQueryBuilder('purchaseIntent')
      .setLock('pessimistic_write')
      .where('purchaseIntent.id = :id', { id })
      .getOne();
  }

  async countActiveByBuyerUserId(buyerUserId: string): Promise<number> {
    return this.repo.count({
      where: {
        buyerUserId,
        state: PurchaseIntentState.ACTIVE,
      },
    });
  }

  async expireActiveByListingExcept(
    listingId: string,
    exceptId: string | null,
    resolvedByUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    const query = manager
      .createQueryBuilder()
      .update(PurchaseIntentEntity)
      .set({
        state: PurchaseIntentState.EXPIRED,
        expiresAt: () => 'NOW()' as never,
        updatedAt: () => 'NOW()' as never,
        resolvedByUserId,
      })
      .where('listing_id = :listingId', { listingId })
      .andWhere('state = :activeState', {
        activeState: PurchaseIntentState.ACTIVE,
      });

    if (exceptId) {
      query.andWhere('id <> :exceptId', { exceptId });
    }

    await query.execute();
  }
}

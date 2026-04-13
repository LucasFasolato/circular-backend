import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ListingTradePreferenceEntity } from '../domain/listing-trade-preference.entity';

@Injectable()
export class ListingTradePreferenceRepository {
  constructor(
    @InjectRepository(ListingTradePreferenceEntity)
    private readonly repo: Repository<ListingTradePreferenceEntity>,
  ) {}

  async findByListingId(
    listingId: string,
    manager?: EntityManager,
  ): Promise<ListingTradePreferenceEntity | null> {
    const repo = manager
      ? manager.getRepository(ListingTradePreferenceEntity)
      : this.repo;
    return repo.findOne({ where: { listingId } });
  }

  async save(
    entity: ListingTradePreferenceEntity,
    manager?: EntityManager,
  ): Promise<ListingTradePreferenceEntity> {
    const repo = manager
      ? manager.getRepository(ListingTradePreferenceEntity)
      : this.repo;
    return repo.save(entity);
  }

  async create(
    data: Partial<ListingTradePreferenceEntity>,
    manager?: EntityManager,
  ): Promise<ListingTradePreferenceEntity> {
    const repo = manager
      ? manager.getRepository(ListingTradePreferenceEntity)
      : this.repo;
    const tradePreference = repo.create(data);
    return repo.save(tradePreference);
  }

  async deleteByListingId(
    listingId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(ListingTradePreferenceEntity)
      : this.repo;
    await repo.delete({ listingId });
  }
}

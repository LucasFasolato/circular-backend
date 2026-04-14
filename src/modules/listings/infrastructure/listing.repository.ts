import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { ListingEntity } from '../domain/listing.entity';

export interface MyListingsQuery {
  ownerUserId: string;
  state?: string;
  limit: number;
  cursor?: {
    updatedAt: string;
    id: string;
  };
}

@Injectable()
export class ListingRepository {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly repo: Repository<ListingEntity>,
  ) {}

  async create(
    data: Partial<ListingEntity>,
    manager?: EntityManager,
  ): Promise<ListingEntity> {
    const repo = manager ? manager.getRepository(ListingEntity) : this.repo;
    const listing = repo.create(data);
    return repo.save(listing);
  }

  async save(
    listing: ListingEntity,
    manager?: EntityManager,
  ): Promise<ListingEntity> {
    const repo = manager ? manager.getRepository(ListingEntity) : this.repo;
    return repo.save(listing);
  }

  async updateDominantPhotoId(
    listingId: string,
    dominantPhotoId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(ListingEntity) : this.repo;
    await repo.update({ id: listingId }, { dominantPhotoId });
  }

  async findById(listingId: string): Promise<ListingEntity | null> {
    return this.findByIdWithManager(listingId);
  }

  async findByIdWithManager(
    listingId: string,
    manager?: EntityManager,
  ): Promise<ListingEntity | null> {
    const repo = manager ? manager.getRepository(ListingEntity) : this.repo;
    return repo.findOne({
      where: { id: listingId },
      relations: ['garment', 'photos', 'tradePreference', 'dominantPhoto'],
      order: {
        photos: {
          position: 'ASC',
        },
      },
    });
  }

  async findByIdForUpdate(
    listingId: string,
    manager: EntityManager,
  ): Promise<ListingEntity | null> {
    return manager
      .getRepository(ListingEntity)
      .createQueryBuilder('listing')
      .setLock('pessimistic_write')
      .where('listing.id = :listingId', { listingId })
      .getOne();
  }

  async findManyByIds(
    ids: string[],
    manager?: EntityManager,
  ): Promise<ListingEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    const repo = manager ? manager.getRepository(ListingEntity) : this.repo;
    return repo.find({
      where: { id: In(ids) },
      relations: ['garment', 'dominantPhoto'],
    });
  }

  async findManyByIdsForUpdate(
    ids: string[],
    manager: EntityManager,
  ): Promise<ListingEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return manager
      .getRepository(ListingEntity)
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.garment', 'garment')
      .leftJoinAndSelect('listing.dominantPhoto', 'dominantPhoto')
      .setLock('pessimistic_write')
      .where('listing.id IN (:...ids)', { ids })
      .getMany();
  }

  async findMyListings(query: MyListingsQuery): Promise<ListingEntity[]> {
    const qb = this.repo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.garment', 'garment')
      .leftJoinAndSelect('listing.photos', 'photo')
      .leftJoinAndSelect('listing.tradePreference', 'tradePreference')
      .where('listing.owner_user_id = :ownerUserId', {
        ownerUserId: query.ownerUserId,
      })
      .orderBy('listing.updated_at', 'DESC')
      .addOrderBy('listing.id', 'DESC')
      .take(query.limit);

    if (query.state) {
      qb.andWhere('listing.state = :state', { state: query.state });
    }

    if (query.cursor) {
      const cursor = query.cursor;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('listing.updated_at < :cursorUpdatedAt', {
              cursorUpdatedAt: cursor.updatedAt,
            })
            .orWhere(
              'listing.updated_at = :cursorUpdatedAt AND listing.id < :cursorId',
              {
                cursorUpdatedAt: cursor.updatedAt,
                cursorId: cursor.id,
              },
            );
        }),
      );
    }

    return qb.getMany();
  }

  async countActiveOwnedByUser(ownerUserId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('listing')
      .where('listing.owner_user_id = :ownerUserId', { ownerUserId })
      .andWhere('listing.state != :archivedState', {
        archivedState: 'ARCHIVED',
      })
      .getCount();
  }
}

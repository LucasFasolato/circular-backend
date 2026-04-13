import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ListingPhotoEntity } from '../domain/listing-photo.entity';

@Injectable()
export class ListingPhotoRepository {
  constructor(
    @InjectRepository(ListingPhotoEntity)
    private readonly repo: Repository<ListingPhotoEntity>,
  ) {}

  async createMany(
    data: Array<Partial<ListingPhotoEntity>>,
    manager?: EntityManager,
  ): Promise<ListingPhotoEntity[]> {
    const repo = manager
      ? manager.getRepository(ListingPhotoEntity)
      : this.repo;
    const photos = repo.create(data);
    return repo.save(photos);
  }

  async findByListingId(listingId: string): Promise<ListingPhotoEntity[]> {
    return this.repo.find({
      where: { listingId },
      order: { position: 'ASC' },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ImageAuditEntity } from '../domain/image-audit.entity';

@Injectable()
export class ImageAuditRepository {
  constructor(
    @InjectRepository(ImageAuditEntity)
    private readonly repo: Repository<ImageAuditEntity>,
  ) {}

  async createMany(
    data: Array<Partial<ImageAuditEntity>>,
    manager?: EntityManager,
  ): Promise<ImageAuditEntity[]> {
    const repo = manager ? manager.getRepository(ImageAuditEntity) : this.repo;
    const audits = repo.create(data);
    return repo.save(audits);
  }

  async findByListingPhotoIds(
    listingPhotoIds: string[],
  ): Promise<ImageAuditEntity[]> {
    if (listingPhotoIds.length === 0) {
      return [];
    }

    return this.repo
      .createQueryBuilder('imageAudit')
      .where('imageAudit.listing_photo_id IN (:...listingPhotoIds)', {
        listingPhotoIds,
      })
      .orderBy('imageAudit.created_at', 'DESC')
      .getMany();
  }
}

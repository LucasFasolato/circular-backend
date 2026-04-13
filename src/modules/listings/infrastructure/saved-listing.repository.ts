import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedListingEntity } from '../domain/saved-listing.entity';

@Injectable()
export class SavedListingRepository {
  constructor(
    @InjectRepository(SavedListingEntity)
    private readonly repo: Repository<SavedListingEntity>,
  ) {}

  async exists(userId: string, listingId: string): Promise<boolean> {
    const savedListing = await this.repo.findOne({
      where: { userId, listingId },
      select: ['id'],
    });

    return savedListing !== null;
  }
}

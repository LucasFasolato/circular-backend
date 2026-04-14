import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { GarmentEntity } from '../listings/domain/garment.entity';
import { ListingEntity } from '../listings/domain/listing.entity';
import { ListingPhotoEntity } from '../listings/domain/listing-photo.entity';
import { SavedListingEntity } from '../listings/domain/saved-listing.entity';
import { ListingAvailabilityReadRepository } from '../listings/infrastructure/listing-availability-read.repository';
import { ListingRepository } from '../listings/infrastructure/listing.repository';
import { SavedListingRepository } from '../listings/infrastructure/saved-listing.repository';
import { DiscoveryCategoriesQueryService } from './application/discovery-categories-query.service';
import { DiscoveryFeedQueryService } from './application/discovery-feed-query.service';
import { FeedDismissalService } from './application/feed-dismissal.service';
import { SavedListingsService } from './application/saved-listings.service';
import { FeedDismissalEntity } from './domain/feed-dismissal.entity';
import { DiscoveryFeedRepository } from './infrastructure/discovery-feed.repository';
import { FeedDismissalRepository } from './infrastructure/feed-dismissal.repository';
import { DiscoveryController } from './presentation/discovery.controller';
import { FeedController } from './presentation/feed.controller';
import { SavedListingsController } from './presentation/saved-listings.controller';
import { DiscoveryItemBuilder } from './read-models/discovery-item.builder';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      GarmentEntity,
      ListingEntity,
      ListingPhotoEntity,
      SavedListingEntity,
      FeedDismissalEntity,
    ]),
  ],
  controllers: [FeedController, DiscoveryController, SavedListingsController],
  providers: [
    ListingRepository,
    ListingAvailabilityReadRepository,
    SavedListingRepository,
    DiscoveryFeedRepository,
    FeedDismissalRepository,
    DiscoveryItemBuilder,
    DiscoveryFeedQueryService,
    DiscoveryCategoriesQueryService,
    SavedListingsService,
    FeedDismissalService,
  ],
})
export class DiscoveryModule {}

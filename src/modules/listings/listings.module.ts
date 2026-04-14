import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/domain/user.entity';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { UserRepository } from '../auth/infrastructure/user.repository';
import { ModerationModule } from '../moderation/moderation.module';
import { PublicProfileEntity } from '../profiles/domain/public-profile.entity';
import { ListingQueryService } from './application/listing-query.service';
import { ListingsCommandService } from './application/listings-command.service';
import { ListingSurfaceService } from './application/listing-surface.service';
import { GarmentEntity } from './domain/garment.entity';
import { ListingEntity } from './domain/listing.entity';
import { ListingPhotoEntity } from './domain/listing-photo.entity';
import { ListingTradePreferenceEntity } from './domain/listing-trade-preference.entity';
import { SavedListingEntity } from './domain/saved-listing.entity';
import { GarmentRepository } from './infrastructure/garment.repository';
import { ListingPhotoRepository } from './infrastructure/listing-photo.repository';
import { ListingAvailabilityReadRepository } from './infrastructure/listing-availability-read.repository';
import { ListingRepository } from './infrastructure/listing.repository';
import { ListingTradePreferenceRepository } from './infrastructure/listing-trade-preference.repository';
import { LocalListingPhotoStorageService } from './infrastructure/local-listing-photo-storage.service';
import { OptionalJwtAuthGuard } from './infrastructure/optional-jwt-auth.guard';
import { PublicProfileReadRepository } from './infrastructure/public-profile-read.repository';
import { SavedListingRepository } from './infrastructure/saved-listing.repository';
import { ListingsController } from './presentation/listings.controller';

@Module({
  imports: [
    ModerationModule,
    TypeOrmModule.forFeature([
      UserEntity,
      PublicProfileEntity,
      GarmentEntity,
      ListingEntity,
      ListingPhotoEntity,
      ListingTradePreferenceEntity,
      SavedListingEntity,
    ]),
  ],
  controllers: [ListingsController],
  providers: [
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    UserRepository,
    GarmentRepository,
    ListingRepository,
    ListingPhotoRepository,
    ListingAvailabilityReadRepository,
    ListingTradePreferenceRepository,
    SavedListingRepository,
    PublicProfileReadRepository,
    LocalListingPhotoStorageService,
    ListingSurfaceService,
    ListingQueryService,
    ListingsCommandService,
  ],
  exports: [ListingRepository, SavedListingRepository],
})
export class ListingsModule {}

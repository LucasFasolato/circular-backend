import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/domain/user.entity';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { ListingEntity } from '../listings/domain/listing.entity';
import { ListingPhotoEntity } from '../listings/domain/listing-photo.entity';
import { ListingPhotoRepository } from '../listings/infrastructure/listing-photo.repository';
import { ListingRepository } from '../listings/infrastructure/listing.repository';
import { IMAGE_MODERATION_PROVIDER } from './domain/image-moderation-provider.interface';
import { ImageAuditEntity } from './domain/image-audit.entity';
import { ModerationReviewEntity } from './domain/moderation-review.entity';
import { ListingModerationWorkflowService } from './application/listing-moderation-workflow.service';
import { ModerationQueryService } from './application/moderation-query.service';
import { ImageAuditRepository } from './infrastructure/image-audit.repository';
import { LocalImageModerationProvider } from './infrastructure/local-image-moderation.provider';
import { ModerationReviewRepository } from './infrastructure/moderation-review.repository';
import { ModerationController } from './presentation/moderation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ListingEntity,
      ListingPhotoEntity,
      ModerationReviewEntity,
      ImageAuditEntity,
    ]),
  ],
  controllers: [ModerationController],
  providers: [
    JwtAuthGuard,
    ListingRepository,
    ListingPhotoRepository,
    ModerationReviewRepository,
    ImageAuditRepository,
    ModerationQueryService,
    ListingModerationWorkflowService,
    {
      provide: IMAGE_MODERATION_PROVIDER,
      useClass: LocalImageModerationProvider,
    },
  ],
  exports: [ListingModerationWorkflowService],
})
export class ModerationModule {}

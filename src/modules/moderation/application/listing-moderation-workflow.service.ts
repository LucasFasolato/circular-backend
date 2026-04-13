import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { ImageAuditStatus } from '../../listings/domain/image-audit-status.enum';
import { LISTING_LIMITS } from '../../listings/domain/listing-limits.constants';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingPhotoRepository } from '../../listings/infrastructure/listing-photo.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import {
  AuditImageResult,
  IMAGE_MODERATION_PROVIDER,
  ImageModerationProvider,
} from '../domain/image-moderation-provider.interface';
import { ModerationReasonCode } from '../domain/moderation-reason-code.enum';
import { ModerationReason } from '../domain/moderation-reason.interface';
import { ModerationReviewState } from '../domain/moderation-review-state.enum';
import { ImageAuditRepository } from '../infrastructure/image-audit.repository';
import { ModerationReviewRepository } from '../infrastructure/moderation-review.repository';

@Injectable()
export class ListingModerationWorkflowService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly listingRepository: ListingRepository,
    private readonly listingPhotoRepository: ListingPhotoRepository,
    private readonly moderationReviewRepository: ModerationReviewRepository,
    private readonly imageAuditRepository: ImageAuditRepository,
    @Inject(IMAGE_MODERATION_PROVIDER)
    private readonly imageModerationProvider: ImageModerationProvider,
  ) {}

  async submitForReview(
    ownerUserId: string,
    listingId: string,
  ): Promise<ListingState> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.ownerUserId !== ownerUserId) {
      throw new ForbiddenError('You can only submit your own listings');
    }

    const listingState = listing.state as ListingState;

    if (
      listingState !== ListingState.DRAFT &&
      listingState !== ListingState.OBSERVED
    ) {
      throw new ValidationAppError('Listing cannot be submitted for review', [
        {
          field: 'state',
          message: 'Only DRAFT or OBSERVED listings can be submitted',
        },
      ]);
    }

    if (listing.photos.length < LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT) {
      throw new ValidationAppError('Listing needs more photos', [
        {
          field: 'photos',
          message: `At least ${LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT} photos are required`,
        },
      ]);
    }

    return this.dataSource.transaction(async (manager) => {
      const listingInTransaction = await this.getOwnedListingInTransaction(
        listingId,
        ownerUserId,
        manager,
      );
      const previousReview =
        await this.moderationReviewRepository.findLatestRelevantByListingId(
          listingId,
          manager,
        );
      const latestReview =
        await this.moderationReviewRepository.findLatestByListingId(
          listingId,
          manager,
        );
      const nextReviewVersion = (latestReview?.reviewVersion ?? 0) + 1;

      if (previousReview) {
        previousReview.state = ModerationReviewState.SUPERSEDED;
        previousReview.supersededAt = new Date();
        previousReview.resolvedAt = previousReview.resolvedAt ?? new Date();
        await this.moderationReviewRepository.save(previousReview, manager);
      }

      listingInTransaction.state = ListingState.IN_REVIEW;
      await this.listingRepository.save(listingInTransaction, manager);

      const moderationReview = await this.moderationReviewRepository.create(
        {
          listingId,
          state: ModerationReviewState.PENDING,
          reasons: [],
          providerSummary: null,
          reviewVersion: nextReviewVersion,
          startedAt: new Date(),
          resolvedAt: null,
          supersededAt: null,
          createdBySystem: true,
          resolvedByUserId: null,
        },
        manager,
      );

      const photoAudits = await Promise.all(
        listingInTransaction.photos.map((photo) =>
          this.imageModerationProvider.auditImage({
            listingId,
            photoId: photo.id,
            objectKey: photo.objectKey,
            publicUrl: photo.publicUrl,
            mimeType: photo.mimeType,
            sizeBytes: photo.sizeBytes,
            width: photo.width,
            height: photo.height,
          }),
        ),
      );

      await this.imageAuditRepository.createMany(
        listingInTransaction.photos.map((photo, index) => ({
          listingPhotoId: photo.id,
          status: photoAudits[index].status,
          reasons: photoAudits[index].reasons,
          providerName: photoAudits[index].providerName,
          providerPayload: photoAudits[index].providerPayload,
          auditedAt: photoAudits[index].auditedAt,
        })),
        manager,
      );

      listingInTransaction.photos.forEach((photo, index) => {
        photo.auditStatus = photoAudits[index].status;
      });
      await this.listingPhotoRepository.saveMany(
        listingInTransaction.photos,
        manager,
      );

      const resolution = this.resolveListingModeration(
        listingInTransaction,
        photoAudits,
      );

      moderationReview.state = resolution.reviewState;
      moderationReview.reasons = resolution.reasons;
      moderationReview.providerSummary = {
        provider: 'local-stub',
        approvedPhotos: photoAudits.filter(
          (audit) => audit.status === ImageAuditStatus.APPROVED,
        ).length,
        observedPhotos: photoAudits.filter(
          (audit) => audit.status === ImageAuditStatus.OBSERVED,
        ).length,
        rejectedPhotos: photoAudits.filter(
          (audit) => audit.status === ImageAuditStatus.REJECTED,
        ).length,
        qualityScore: resolution.qualityScore,
      };
      moderationReview.resolvedAt = new Date();
      await this.moderationReviewRepository.save(moderationReview, manager);

      listingInTransaction.state = resolution.listingState;
      listingInTransaction.qualityScore = resolution.qualityScore;

      if (resolution.listingState === ListingState.PUBLISHED) {
        listingInTransaction.publishedAt =
          listingInTransaction.publishedAt ?? new Date();
      }

      if (resolution.listingState === ListingState.REJECTED) {
        listingInTransaction.publishedAt = null;
      }

      await this.listingRepository.save(listingInTransaction, manager);

      return resolution.listingState;
    });
  }

  async assertHasApprovedReview(listingId: string): Promise<void> {
    const latestReview =
      await this.moderationReviewRepository.findLatestRelevantByListingId(
        listingId,
      );
    const reviewState = latestReview?.state as
      | ModerationReviewState
      | undefined;

    if (!latestReview || reviewState !== ModerationReviewState.APPROVED) {
      throw new ValidationAppError('Listing review is not approved', [
        {
          field: 'listing',
          message:
            'listing cannot move to PUBLISHED without an approved moderation review',
        },
      ]);
    }
  }

  private async getOwnedListingInTransaction(
    listingId: string,
    ownerUserId: string,
    manager: EntityManager,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findByIdWithManager(
      listingId,
      manager,
    );

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.ownerUserId !== ownerUserId) {
      throw new ForbiddenError('You can only submit your own listings');
    }

    return listing;
  }

  private resolveListingModeration(
    listing: ListingEntity,
    imageResults: AuditImageResult[],
  ): {
    listingState: ListingState;
    reviewState: ModerationReviewState;
    reasons: ModerationReason[];
    qualityScore: number;
  } {
    const reasons: ModerationReason[] = [];

    reasons.push(...imageResults.flatMap((result) => result.reasons));

    if (!listing.description || listing.description.trim().length < 20) {
      reasons.push({
        code: ModerationReasonCode.MISSING_REQUIRED_DATA,
        message:
          'La publicación necesita una descripción más completa para poder aprobarse.',
      });
    }

    const uniquePhotoFingerprints = new Set(
      listing.photos.map(
        (photo) => `${photo.width}:${photo.height}:${photo.sizeBytes}`,
      ),
    );
    if (uniquePhotoFingerprints.size !== listing.photos.length) {
      reasons.push({
        code: ModerationReasonCode.PHOTO_DUPLICATED,
        message: 'Se detectaron fotos duplicadas o demasiado similares.',
      });
    }

    if (this.containsBlockedContent(listing)) {
      reasons.push({
        code: ModerationReasonCode.PHOTO_CONTENT_NOT_ALLOWED,
        message:
          'La publicación contiene señales incompatibles con la política de contenido.',
      });
    }

    const qualityScore = this.computeQualityScore(
      listing,
      imageResults,
      reasons,
    );

    if (
      reasons.some(
        (reason) =>
          reason.code === ModerationReasonCode.PHOTO_CONTENT_NOT_ALLOWED,
      )
    ) {
      return {
        listingState: ListingState.REJECTED,
        reviewState: ModerationReviewState.REJECTED,
        reasons: this.deduplicateReasons(reasons),
        qualityScore,
      };
    }

    if (reasons.length > 0) {
      return {
        listingState: ListingState.OBSERVED,
        reviewState: ModerationReviewState.OBSERVED,
        reasons: this.deduplicateReasons(reasons),
        qualityScore,
      };
    }

    return {
      listingState: ListingState.PUBLISHED,
      reviewState: ModerationReviewState.APPROVED,
      reasons: [],
      qualityScore,
    };
  }

  private computeQualityScore(
    listing: ListingEntity,
    imageResults: AuditImageResult[],
    reasons: ModerationReason[],
  ): number {
    let score = 100;

    score -= reasons.length * 12;
    if ((listing.description?.trim().length ?? 0) < 40) {
      score -= 8;
    }
    if (listing.photos.length === LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT) {
      score -= 5;
    }
    score -=
      imageResults.filter(
        (result) => result.status === ImageAuditStatus.OBSERVED,
      ).length * 10;

    return Math.max(0, Math.min(100, score));
  }

  private deduplicateReasons(reasons: ModerationReason[]): ModerationReason[] {
    const seen = new Set<string>();
    return reasons.filter((reason) => {
      const key = `${reason.code}:${reason.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private containsBlockedContent(listing: ListingEntity): boolean {
    const content = [
      listing.description,
      listing.garment.brand,
      listing.garment.color,
      listing.garment.material,
      listing.garment.subcategory,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();

    return /(weapon|knife|drugs|porn|nude|explicit)/i.test(content);
  }
}

import { Injectable } from '@nestjs/common';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { ModerationReviewState } from '../domain/moderation-review-state.enum';
import { ImageAuditRepository } from '../infrastructure/image-audit.repository';
import { ModerationReviewRepository } from '../infrastructure/moderation-review.repository';
import {
  ListingModerationDetailResponseDto,
  ModerationImageAuditDto,
  ObservedListingItemDto,
  ObservedListingsResponseDto,
} from '../presentation/dto/moderation-response.dto';

@Injectable()
export class ModerationQueryService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly moderationReviewRepository: ModerationReviewRepository,
    private readonly imageAuditRepository: ImageAuditRepository,
  ) {}

  async getListingModeration(
    viewerUserId: string,
    listingId: string,
  ): Promise<ListingModerationDetailResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    this.assertOwnerCanView(viewerUserId, listing.ownerUserId);

    const review =
      await this.moderationReviewRepository.findLatestRelevantByListingId(
        listingId,
      );

    if (!review) {
      throw new NotFoundError('Moderation review not found');
    }

    const imageAudits = await this.getLatestImageAuditsForListing(
      listing.photos,
    );

    return {
      listingId: listing.id,
      listingState: listing.state as ListingState,
      moderation: {
        status: review.state as ModerationReviewState,
        reasons: review.reasons,
        reviewVersion: review.reviewVersion,
        resolvedAt: review.resolvedAt?.toISOString() ?? null,
        imageAudits,
      },
      availableActions: {
        canEdit: (listing.state as ListingState) === ListingState.OBSERVED,
        canResubmit: (listing.state as ListingState) === ListingState.OBSERVED,
      },
    };
  }

  async getObservedListings(
    ownerUserId: string,
  ): Promise<ObservedListingsResponseDto> {
    const listings = await this.listingRepository.findMyListings({
      ownerUserId,
      state: ListingState.OBSERVED,
      limit: 100,
    });

    const items = await Promise.all(
      listings.map(async (listing) => {
        const review =
          await this.moderationReviewRepository.findLatestRelevantByListingId(
            listing.id,
          );

        const moderationStatus = review?.state ?? ModerationReviewState.PENDING;
        const reasons = review?.reasons ?? [];

        return {
          listingId: listing.id,
          state: listing.state as ListingState,
          description: listing.description,
          garment: {
            category: listing.garment.category,
            subcategory: listing.garment.subcategory,
            size: listing.garment.size,
            condition: listing.garment.condition,
          },
          location: {
            city: listing.city,
            zone: listing.zone,
          },
          photos: listing.photos.map((photo) => ({
            id: photo.id,
            url: photo.publicUrl,
            position: photo.position,
            auditStatus: photo.auditStatus as never,
          })),
          moderation: {
            status: moderationStatus as ModerationReviewState,
            reasons,
          },
          availableActions: {
            canEdit: true,
            canResubmit: true,
          },
        } satisfies ObservedListingItemDto;
      }),
    );

    return { items };
  }

  private assertOwnerCanView(viewerUserId: string, ownerUserId: string): void {
    if (viewerUserId !== ownerUserId) {
      throw new ForbiddenError(
        'Only the listing owner can access moderation details',
      );
    }
  }

  private async getLatestImageAuditsForListing(
    photos: Array<{ id: string }>,
  ): Promise<ModerationImageAuditDto[]> {
    const audits = await this.imageAuditRepository.findByListingPhotoIds(
      photos.map((photo) => photo.id),
    );
    const latestByPhotoId = new Map<string, ModerationImageAuditDto>();

    for (const audit of audits) {
      if (latestByPhotoId.has(audit.listingPhotoId)) {
        continue;
      }

      latestByPhotoId.set(audit.listingPhotoId, {
        photoId: audit.listingPhotoId,
        status: audit.status as never,
        reasons: audit.reasons,
      });
    }

    return photos
      .map((photo) => latestByPhotoId.get(photo.id))
      .filter((audit): audit is ModerationImageAuditDto => audit !== undefined);
  }
}

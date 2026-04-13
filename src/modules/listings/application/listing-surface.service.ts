import { Injectable } from '@nestjs/common';
import { PublicProfileReadRepository } from '../infrastructure/public-profile-read.repository';
import { SavedListingRepository } from '../infrastructure/saved-listing.repository';
import { ListingEntity } from '../domain/listing.entity';
import { ListingDetailResponseDto } from '../presentation/dto/listing-response.dto';
import {
  canArchiveListing,
  canEditListing,
  canPauseListing,
  canResumeListing,
  canSubmitListingForReview,
} from '../domain/listing-state.policy';
import { ListingState } from '../domain/listing-state.enum';
import { LISTING_LIMITS } from '../domain/listing-limits.constants';
import { ImageAuditStatus } from '../domain/image-audit-status.enum';

@Injectable()
export class ListingSurfaceService {
  constructor(
    private readonly publicProfileReadRepository: PublicProfileReadRepository,
    private readonly savedListingRepository: SavedListingRepository,
  ) {}

  async buildDetail(
    listing: ListingEntity,
    viewerUserId?: string,
  ): Promise<ListingDetailResponseDto> {
    const ownerProfile = await this.publicProfileReadRepository.findByUserId(
      listing.ownerUserId,
    );
    const isOwner = viewerUserId === listing.ownerUserId;
    const isSaved =
      !isOwner && viewerUserId
        ? await this.savedListingRepository.exists(viewerUserId, listing.id)
        : false;
    const photoCount = listing.photos.length;
    const listingState = listing.state as ListingState;

    return {
      listing: {
        id: listing.id,
        state: listingState,
        description: listing.description,
        qualityScore: listing.qualityScore,
        qualityLabels: this.deriveQualityLabels(listing),
        garment: {
          category: listing.garment.category as never,
          subcategory: listing.garment.subcategory,
          size: listing.garment.size as never,
          condition: listing.garment.condition as never,
          brand: listing.garment.brand,
          color: listing.garment.color,
          material: listing.garment.material,
        },
        commercialConfig: {
          allowsPurchase: listing.allowsPurchase,
          allowsTrade: listing.allowsTrade,
          price: listing.priceAmount,
          currencyCode: listing.currencyCode as never,
          tradePreferences: listing.tradePreference
            ? {
                desiredCategories: listing.tradePreference
                  .desiredCategories as never,
                desiredSizes: listing.tradePreference.desiredSizes as never,
                notes: listing.tradePreference.notes,
              }
            : null,
        },
        location: {
          city: listing.city,
          zone: listing.zone,
        },
        photos: listing.photos.map((photo) => ({
          id: photo.id,
          url: photo.publicUrl,
          position: photo.position,
          auditStatus: photo.auditStatus as ImageAuditStatus,
        })),
        owner: {
          id: listing.ownerUserId,
          firstName: ownerProfile?.firstName ?? '',
          instagramHandle: ownerProfile?.instagramHandle ?? null,
        },
        publishedAt: listing.publishedAt?.toISOString() ?? null,
        reservationExpiresAt:
          listing.reservationExpiresAt?.toISOString() ?? null,
        archivedAt: listing.archivedAt?.toISOString() ?? null,
      },
      viewerContext: {
        isOwner,
        isSaved,
        hasActivePurchaseIntent: false,
        hasActiveTradeProposal: false,
      },
      availableActions: {
        canUploadPhotos:
          isOwner &&
          canEditListing(listingState) &&
          photoCount < LISTING_LIMITS.MAX_PHOTOS_PER_LISTING,
        canSubmitForReview:
          isOwner &&
          canSubmitListingForReview(listingState) &&
          photoCount >= LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT,
        canEdit: isOwner && canEditListing(listingState),
        canArchive: isOwner && canArchiveListing(listingState),
        canPause: isOwner && canPauseListing(listingState),
        canResume: isOwner && canResumeListing(listingState),
        canBuy:
          !isOwner &&
          listingState === ListingState.PUBLISHED &&
          listing.allowsPurchase,
        canTrade:
          !isOwner &&
          listingState === ListingState.PUBLISHED &&
          listing.allowsTrade,
        canSave:
          !isOwner &&
          !!viewerUserId &&
          listingState === ListingState.PUBLISHED &&
          !isSaved,
        canUnsave:
          !isOwner &&
          !!viewerUserId &&
          listingState === ListingState.PUBLISHED &&
          isSaved,
        canRenewReservation: false,
      },
    };
  }

  async buildMany(
    listings: ListingEntity[],
    viewerUserId: string,
  ): Promise<ListingDetailResponseDto[]> {
    return Promise.all(
      listings.map((listing) => this.buildDetail(listing, viewerUserId)),
    );
  }

  private deriveQualityLabels(listing: ListingEntity): string[] {
    const labels: string[] = [];

    if ((listing.qualityScore ?? 0) >= 80) {
      labels.push('HIGH_QUALITY');
    }

    const approvedOrPendingPhotos = listing.photos.filter((photo) => {
      const auditStatus = photo.auditStatus as ImageAuditStatus;
      return (
        auditStatus === ImageAuditStatus.APPROVED ||
        auditStatus === ImageAuditStatus.PENDING
      );
    }).length;

    if (approvedOrPendingPhotos >= LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT) {
      labels.push('GOOD_PHOTOS');
    }

    return labels;
  }
}

import { Injectable } from '@nestjs/common';
import { PublicProfileReadRepository } from '../infrastructure/public-profile-read.repository';
import { SavedListingRepository } from '../infrastructure/saved-listing.repository';
import { ListingAvailabilityReadRepository } from '../infrastructure/listing-availability-read.repository';
import { ListingEntity } from '../domain/listing.entity';
import { ListingDetailResponseDto } from '../presentation/dto/listing-response.dto';
import { ListingState } from '../domain/listing-state.enum';
import { ImageAuditStatus } from '../domain/image-audit-status.enum';
import { deriveQualityLabels } from '../domain/listing-quality-label.policy';
import { ListingAvailabilityPolicy } from './listing-availability.policy';

@Injectable()
export class ListingSurfaceService {
  constructor(
    private readonly publicProfileReadRepository: PublicProfileReadRepository,
    private readonly savedListingRepository: SavedListingRepository,
    private readonly listingAvailabilityReadRepository: ListingAvailabilityReadRepository,
  ) {}

  async buildDetail(
    listing: ListingEntity,
    viewerUserId?: string,
  ): Promise<ListingDetailResponseDto> {
    const ownerProfile = await this.publicProfileReadRepository.findByUserId(
      listing.ownerUserId,
    );
    const isOwner = viewerUserId === listing.ownerUserId;
    const [isSaved, availabilitySignals] = await Promise.all([
      !isOwner && viewerUserId
        ? this.savedListingRepository.exists(viewerUserId, listing.id)
        : Promise.resolve(false),
      this.listingAvailabilityReadRepository.getSignals(
        listing.id,
        viewerUserId,
      ),
    ]);
    const photoCount = listing.photos.length;
    const listingState = listing.state as ListingState;
    const availabilityContext = {
      ownerUserId: listing.ownerUserId,
      state: listingState,
      archivedAt: listing.archivedAt,
      reservationExpiresAt: listing.reservationExpiresAt,
      allowsPurchase: listing.allowsPurchase,
      allowsTrade: listing.allowsTrade,
      viewerUserId,
      isSaved,
      hasActivePurchaseIntent: availabilitySignals.hasActivePurchaseIntent,
      hasActiveTradeProposal: availabilitySignals.hasActiveTradeProposal,
      hasActiveMatch: availabilitySignals.hasActiveMatch,
      isCommittedProposedItem: availabilitySignals.isCommittedProposedItem,
      photoCount,
    };
    const viewerContext =
      ListingAvailabilityPolicy.deriveViewerContext(availabilityContext);
    const availableActions =
      ListingAvailabilityPolicy.deriveAvailableActions(availabilityContext);

    return {
      listing: {
        id: listing.id,
        state: listingState,
        description: listing.description,
        qualityScore: listing.qualityScore,
        qualityLabels: deriveQualityLabels(
          listing.qualityScore,
          listing.photos.filter((photo) => {
            const auditStatus = photo.auditStatus as ImageAuditStatus;
            return (
              auditStatus === ImageAuditStatus.APPROVED ||
              auditStatus === ImageAuditStatus.PENDING
            );
          }).length,
        ),
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
      viewerContext,
      availableActions,
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
}

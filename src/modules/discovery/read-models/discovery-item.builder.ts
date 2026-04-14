import { Injectable } from '@nestjs/common';
import { deriveQualityLabels } from '../../listings/domain/listing-quality-label.policy';
import { ListingState } from '../../listings/domain/listing-state.enum';
import {
  buildDiscoveryAvailableActions,
  buildDiscoveryViewerContext,
  deriveDiscoveryBadges,
} from '../application/discovery-listing.policy';
import { DiscoveryListingSnapshot } from '../infrastructure/discovery-feed.repository';
import {
  DiscoveryFeedItemDto,
  SavedListingItemDto,
  SaveListingStateResponseDto,
} from '../presentation/dto/discovery-feed.response.dto';

@Injectable()
export class DiscoveryItemBuilder {
  buildFeedItem(snapshot: DiscoveryListingSnapshot): DiscoveryFeedItemDto {
    const viewerContext = buildDiscoveryViewerContext(false, snapshot.isSaved);

    return {
      id: snapshot.id,
      state: snapshot.state as ListingState,
      photo: snapshot.photoUrl,
      category: snapshot.category as never,
      subcategory: snapshot.subcategory,
      size: snapshot.size as never,
      qualityScore: snapshot.qualityScore,
      qualityLabels: deriveQualityLabels(
        snapshot.qualityScore,
        snapshot.approvedOrPendingPhotoCount,
      ),
      badges: deriveDiscoveryBadges(
        snapshot.allowsPurchase,
        snapshot.allowsTrade,
      ),
      location: {
        city: snapshot.city,
        zone: snapshot.zone,
      },
      price: snapshot.price,
      viewerContext,
      availableActions: buildDiscoveryAvailableActions({
        isOwner: viewerContext.isOwner,
        isSaved: viewerContext.isSaved,
        isDismissed: snapshot.isDismissed,
        allowsPurchase: snapshot.allowsPurchase,
        allowsTrade: snapshot.allowsTrade,
        state: snapshot.state as ListingState,
        archivedAt: null,
      }),
    };
  }

  buildSavedItem(
    snapshot: DiscoveryListingSnapshot & { savedAt: string },
  ): SavedListingItemDto {
    return {
      ...this.buildFeedItem(snapshot),
      savedAt: snapshot.savedAt,
    };
  }

  buildSaveStateResponse(input: {
    listingId: string;
    state: ListingState;
    allowsPurchase: boolean;
    allowsTrade: boolean;
    isSaved: boolean;
    isDismissed: boolean;
    archivedAt: Date | null;
  }): SaveListingStateResponseDto {
    const viewerContext = buildDiscoveryViewerContext(false, input.isSaved);

    return {
      listingId: input.listingId,
      state: input.state,
      saved: input.isSaved,
      viewerContext,
      availableActions: buildDiscoveryAvailableActions({
        isOwner: viewerContext.isOwner,
        isSaved: viewerContext.isSaved,
        isDismissed: input.isDismissed,
        allowsPurchase: input.allowsPurchase,
        allowsTrade: input.allowsTrade,
        state: input.state,
        archivedAt: input.archivedAt,
      }),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { deriveQualityLabels } from '../../listings/domain/listing-quality-label.policy';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingAvailabilityPolicy } from '../../listings/application/listing-availability.policy';
import {
  buildDiscoveryAvailableActions,
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
    const policyContext = {
      ownerUserId: snapshot.ownerUserId,
      state: snapshot.state as ListingState,
      archivedAt: null,
      reservationExpiresAt: null,
      allowsPurchase: snapshot.allowsPurchase,
      allowsTrade: snapshot.allowsTrade,
      viewerUserId: 'viewer',
      isSaved: snapshot.isSaved,
      isDismissed: snapshot.isDismissed,
      hasActivePurchaseIntent: snapshot.hasActivePurchaseIntent,
      hasActiveTradeProposal: snapshot.hasActiveTradeProposal,
      hasActiveMatch: snapshot.hasActiveMatch,
      isCommittedProposedItem: snapshot.isCommittedProposedItem,
    };
    const viewerContext =
      ListingAvailabilityPolicy.deriveViewerContext(policyContext);
    const actions =
      ListingAvailabilityPolicy.deriveAvailableActions(policyContext);

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
      availableActions: {
        canBuy: actions.canBuy,
        canTrade: actions.canTrade,
        canSave: actions.canSave,
        canUnsave: actions.canUnsave,
        canDismiss: actions.canDismiss,
      },
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
    ownerUserId: string;
    state: ListingState;
    allowsPurchase: boolean;
    allowsTrade: boolean;
    isSaved: boolean;
    isDismissed: boolean;
    archivedAt: Date | null;
    hasActivePurchaseIntent: boolean;
    hasActiveTradeProposal: boolean;
    hasActiveMatch: boolean;
    isCommittedProposedItem: boolean;
  }): SaveListingStateResponseDto {
    const policyContext = {
      viewerUserId: 'viewer',
      ownerUserId: input.ownerUserId,
      isSaved: input.isSaved,
      isDismissed: input.isDismissed,
      allowsPurchase: input.allowsPurchase,
      allowsTrade: input.allowsTrade,
      state: input.state,
      reservationExpiresAt: null,
      archivedAt: input.archivedAt,
      hasActivePurchaseIntent: input.hasActivePurchaseIntent,
      hasActiveTradeProposal: input.hasActiveTradeProposal,
      hasActiveMatch: input.hasActiveMatch,
      isCommittedProposedItem: input.isCommittedProposedItem,
    };
    const viewerContext =
      ListingAvailabilityPolicy.deriveViewerContext(policyContext);

    return {
      listingId: input.listingId,
      state: input.state,
      saved: input.isSaved,
      viewerContext,
      availableActions: buildDiscoveryAvailableActions(policyContext),
    };
  }
}

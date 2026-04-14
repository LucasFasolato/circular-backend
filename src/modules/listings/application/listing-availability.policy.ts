import { LISTING_LIMITS } from '../domain/listing-limits.constants';
import { ListingState } from '../domain/listing-state.enum';
import {
  canArchiveListing,
  canEditListing,
  canPauseListing,
  canResumeListing,
  canSubmitListingForReview,
} from '../domain/listing-state.policy';

export interface ListingAvailabilityContext {
  ownerUserId: string;
  state: ListingState;
  archivedAt: Date | null;
  reservationExpiresAt: Date | null;
  allowsPurchase: boolean;
  allowsTrade: boolean;
  viewerUserId?: string;
  isSaved?: boolean;
  isDismissed?: boolean;
  hasActivePurchaseIntent?: boolean;
  hasActiveTradeProposal?: boolean;
  hasActiveMatch?: boolean;
  isCommittedProposedItem?: boolean;
  photoCount?: number;
  now?: Date;
}

export interface UnifiedListingViewerContext {
  isOwner: boolean;
  isSaved: boolean;
  hasActivePurchaseIntent: boolean;
  hasActiveTradeProposal: boolean;
}

export interface UnifiedListingAvailableActions {
  canUploadPhotos: boolean;
  canSubmitForReview: boolean;
  canEdit: boolean;
  canArchive: boolean;
  canPause: boolean;
  canResume: boolean;
  canBuy: boolean;
  canTrade: boolean;
  canSave: boolean;
  canUnsave: boolean;
  canDismiss: boolean;
  canRenewReservation: boolean;
}

function isOwner(context: ListingAvailabilityContext): boolean {
  return !!context.viewerUserId && context.viewerUserId === context.ownerUserId;
}

export const ListingAvailabilityPolicy = {
  isDiscoverable(context: ListingAvailabilityContext): boolean {
    return (
      context.state === ListingState.PUBLISHED &&
      context.archivedAt === null &&
      !context.hasActiveMatch &&
      !context.isCommittedProposedItem
    );
  },

  canReceiveInteractions(context: ListingAvailabilityContext): boolean {
    return this.isDiscoverable(context);
  },

  canBeSaved(context: ListingAvailabilityContext): boolean {
    return (
      !!context.viewerUserId &&
      !isOwner(context) &&
      this.isDiscoverable(context)
    );
  },

  deriveViewerContext(
    context: ListingAvailabilityContext,
  ): UnifiedListingViewerContext {
    return {
      isOwner: isOwner(context),
      isSaved: context.isSaved ?? false,
      hasActivePurchaseIntent: context.hasActivePurchaseIntent ?? false,
      hasActiveTradeProposal: context.hasActiveTradeProposal ?? false,
    };
  },

  deriveAvailableActions(
    context: ListingAvailabilityContext,
  ): UnifiedListingAvailableActions {
    const viewerContext = this.deriveViewerContext(context);
    const viewerPresent = !!context.viewerUserId;
    const discoverable = this.isDiscoverable(context);
    const photoCount = context.photoCount ?? 0;
    const now = context.now ?? new Date();

    return {
      canUploadPhotos:
        viewerContext.isOwner &&
        canEditListing(context.state) &&
        photoCount < LISTING_LIMITS.MAX_PHOTOS_PER_LISTING,
      canSubmitForReview:
        viewerContext.isOwner &&
        canSubmitListingForReview(context.state) &&
        photoCount >= LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT,
      canEdit: viewerContext.isOwner && canEditListing(context.state),
      canArchive: viewerContext.isOwner && canArchiveListing(context.state),
      canPause: viewerContext.isOwner && canPauseListing(context.state),
      canResume: viewerContext.isOwner && canResumeListing(context.state),
      canBuy:
        !viewerContext.isOwner &&
        discoverable &&
        context.allowsPurchase &&
        !viewerContext.hasActivePurchaseIntent,
      canTrade:
        !viewerContext.isOwner &&
        discoverable &&
        context.allowsTrade &&
        !viewerContext.hasActiveTradeProposal,
      canSave:
        viewerPresent &&
        !viewerContext.isOwner &&
        discoverable &&
        !viewerContext.isSaved,
      canUnsave:
        viewerPresent && !viewerContext.isOwner && viewerContext.isSaved,
      canDismiss:
        viewerPresent &&
        !viewerContext.isOwner &&
        discoverable &&
        !(context.isDismissed ?? false),
      canRenewReservation:
        viewerContext.isOwner &&
        context.state === ListingState.RESERVED &&
        context.reservationExpiresAt !== null &&
        context.reservationExpiresAt > now,
    };
  },
};

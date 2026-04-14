import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
import {
  listingNotAvailableError,
  listingNotPublishedError,
} from '../../listings/domain/listing-errors';
import { DiscoveryBadge } from '../domain/discovery-badge.enum';

export interface DiscoveryViewerContext {
  isOwner: boolean;
  isSaved: boolean;
}

export interface DiscoveryAvailableActions {
  canBuy: boolean;
  canTrade: boolean;
  canSave: boolean;
  canUnsave: boolean;
  canDismiss: boolean;
}

export interface DiscoveryActionContext {
  isOwner: boolean;
  isSaved: boolean;
  isDismissed: boolean;
  allowsPurchase: boolean;
  allowsTrade: boolean;
  state: ListingState;
  archivedAt: Date | null;
}

export function isListingDiscoverable(
  state: ListingState,
  archivedAt: Date | null,
): boolean {
  return state === ListingState.PUBLISHED && archivedAt === null;
}

export function deriveDiscoveryBadges(
  allowsPurchase: boolean,
  allowsTrade: boolean,
): DiscoveryBadge[] {
  const badges: DiscoveryBadge[] = [];

  if (allowsPurchase) {
    badges.push(DiscoveryBadge.PURCHASE);
  }

  if (allowsTrade) {
    badges.push(DiscoveryBadge.TRADE);
  }

  return badges;
}

export function buildDiscoveryViewerContext(
  isOwner: boolean,
  isSaved: boolean,
): DiscoveryViewerContext {
  return {
    isOwner,
    isSaved,
  };
}

export function buildDiscoveryAvailableActions(
  input: DiscoveryActionContext,
): DiscoveryAvailableActions {
  const discoverable = isListingDiscoverable(input.state, input.archivedAt);

  return {
    canBuy: discoverable && !input.isOwner && input.allowsPurchase,
    canTrade: discoverable && !input.isOwner && input.allowsTrade,
    canSave: discoverable && !input.isOwner && !input.isSaved,
    canUnsave: !input.isOwner && input.isSaved,
    canDismiss: discoverable && !input.isOwner && !input.isDismissed,
  };
}

export function assertListingCanBeSaved(
  listing: ListingEntity,
  viewerUserId: string,
): void {
  if (listing.ownerUserId === viewerUserId) {
    throw new ForbiddenError('You cannot save your own listing');
  }

  if ((listing.state as ListingState) !== ListingState.PUBLISHED) {
    throw listingNotPublishedError();
  }

  if (
    !isListingDiscoverable(listing.state as ListingState, listing.archivedAt)
  ) {
    throw listingNotAvailableError();
  }
}

export function assertListingCanBeDismissed(
  listing: ListingEntity,
  viewerUserId: string,
): void {
  if (listing.ownerUserId === viewerUserId) {
    throw new ForbiddenError('You cannot dismiss your own listing');
  }

  if ((listing.state as ListingState) !== ListingState.PUBLISHED) {
    throw listingNotPublishedError();
  }

  if (
    !isListingDiscoverable(listing.state as ListingState, listing.archivedAt)
  ) {
    throw listingNotAvailableError();
  }
}

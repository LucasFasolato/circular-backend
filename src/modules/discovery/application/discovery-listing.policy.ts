import { ListingEntity } from '../../listings/domain/listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
import {
  listingAlreadyClosedError,
  listingAlreadyReservedError,
  listingNotAvailableError,
  listingNotPublishedError,
} from '../../listings/domain/listing-errors';
import { ListingAvailabilityPolicy } from '../../listings/application/listing-availability.policy';
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
  viewerUserId?: string;
  ownerUserId?: string;
  isOwner?: boolean;
  isSaved: boolean;
  isDismissed: boolean;
  hasActivePurchaseIntent?: boolean;
  hasActiveTradeProposal?: boolean;
  hasActiveMatch?: boolean;
  isCommittedProposedItem?: boolean;
  allowsPurchase: boolean;
  allowsTrade: boolean;
  state: ListingState;
  reservationExpiresAt?: Date | null;
  archivedAt: Date | null;
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
  const viewerUserId =
    input.isOwner && !input.viewerUserId ? '__viewer__' : input.viewerUserId;
  const ownerUserId =
    input.isOwner && !input.ownerUserId
      ? '__viewer__'
      : (input.ownerUserId ?? '');
  const actions = ListingAvailabilityPolicy.deriveAvailableActions({
    ownerUserId,
    state: input.state,
    archivedAt: input.archivedAt,
    reservationExpiresAt: input.reservationExpiresAt ?? null,
    allowsPurchase: input.allowsPurchase,
    allowsTrade: input.allowsTrade,
    viewerUserId,
    isSaved: input.isSaved,
    isDismissed: input.isDismissed,
    hasActivePurchaseIntent: input.hasActivePurchaseIntent,
    hasActiveTradeProposal: input.hasActiveTradeProposal,
    hasActiveMatch: input.hasActiveMatch,
    isCommittedProposedItem: input.isCommittedProposedItem,
  });

  return {
    canBuy: actions.canBuy,
    canTrade: actions.canTrade,
    canSave: actions.canSave,
    canUnsave: actions.canUnsave,
    canDismiss: actions.canDismiss,
  };
}

export function isListingDiscoverable(
  state: ListingState,
  archivedAt: Date | null,
): boolean {
  return ListingAvailabilityPolicy.isDiscoverable({
    ownerUserId: '',
    state,
    archivedAt,
    reservationExpiresAt: null,
    allowsPurchase: true,
    allowsTrade: true,
  });
}

export function assertListingCanBeSaved(
  listing: ListingEntity,
  viewerUserId: string,
  input: {
    hasActiveMatch?: boolean;
    isCommittedProposedItem?: boolean;
  } = {},
): void {
  const context = {
    ownerUserId: listing.ownerUserId,
    state: listing.state as ListingState,
    archivedAt: listing.archivedAt,
    reservationExpiresAt: listing.reservationExpiresAt,
    allowsPurchase: listing.allowsPurchase,
    allowsTrade: listing.allowsTrade,
    viewerUserId,
    hasActiveMatch: input.hasActiveMatch,
    isCommittedProposedItem: input.isCommittedProposedItem,
  };

  if ((listing.state as ListingState) !== ListingState.PUBLISHED) {
    throw listingNotPublishedError();
  }

  if ((listing.state as ListingState) === ListingState.RESERVED) {
    throw listingAlreadyReservedError();
  }

  if ((listing.state as ListingState) === ListingState.CLOSED) {
    throw listingAlreadyClosedError();
  }

  if (!ListingAvailabilityPolicy.canBeSaved(context)) {
    throw listingNotAvailableError();
  }
}

export function assertListingCanBeDismissed(
  listing: ListingEntity,
  viewerUserId: string,
  input: {
    hasActiveMatch?: boolean;
    isCommittedProposedItem?: boolean;
  } = {},
): void {
  const context = {
    ownerUserId: listing.ownerUserId,
    state: listing.state as ListingState,
    archivedAt: listing.archivedAt,
    reservationExpiresAt: listing.reservationExpiresAt,
    allowsPurchase: listing.allowsPurchase,
    allowsTrade: listing.allowsTrade,
    viewerUserId,
    hasActiveMatch: input.hasActiveMatch,
    isCommittedProposedItem: input.isCommittedProposedItem,
  };

  if ((listing.state as ListingState) !== ListingState.PUBLISHED) {
    throw listingNotPublishedError();
  }

  if ((listing.state as ListingState) === ListingState.RESERVED) {
    throw listingAlreadyReservedError();
  }

  if ((listing.state as ListingState) === ListingState.CLOSED) {
    throw listingAlreadyClosedError();
  }

  if (!ListingAvailabilityPolicy.canReceiveInteractions(context)) {
    throw listingNotAvailableError();
  }
}

import { ListingEntity } from '../../listings/domain/listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingAvailabilityPolicy } from '../../listings/application/listing-availability.policy';
import {
  listingAlreadyClosedError,
  listingAlreadyReservedError,
  listingNotAvailableError,
  listingNotPublishedError,
} from '../../listings/domain/listing-errors';
import {
  proposedItemNotAvailableError,
  proposedItemNotOwnedError,
  selfInteractionNotAllowedError,
} from '../domain/interaction-errors';

export function assertListingCanReceiveInteraction(
  listing: ListingEntity,
  actorUserId: string,
  input: {
    hasActiveMatch?: boolean;
    isCommittedProposedItem?: boolean;
  } = {},
): void {
  if (listing.ownerUserId === actorUserId) {
    throw selfInteractionNotAllowedError();
  }

  assertListingIsPublishedForInteractions(listing, input);
}

export function assertListingIsPublishedForInteractions(
  listing: ListingEntity,
  input: {
    hasActiveMatch?: boolean;
    isCommittedProposedItem?: boolean;
  } = {},
): void {
  const state = listing.state as ListingState;

  if (
    ListingAvailabilityPolicy.canReceiveInteractions({
      ownerUserId: listing.ownerUserId,
      state,
      archivedAt: listing.archivedAt,
      reservationExpiresAt: listing.reservationExpiresAt,
      allowsPurchase: listing.allowsPurchase,
      allowsTrade: listing.allowsTrade,
      viewerUserId: 'viewer',
      hasActiveMatch: input.hasActiveMatch,
      isCommittedProposedItem: input.isCommittedProposedItem,
    })
  ) {
    return;
  }

  if (state === ListingState.RESERVED) {
    throw listingAlreadyReservedError();
  }

  if (state === ListingState.CLOSED) {
    throw listingAlreadyClosedError();
  }

  if (state === ListingState.ARCHIVED || listing.archivedAt !== null) {
    throw listingNotAvailableError();
  }

  throw listingNotPublishedError();
}

export function assertProposedListingIsAvailable(
  listing: ListingEntity,
  proposerUserId: string,
  input: {
    hasActiveMatch?: boolean;
    isCommittedProposedItem?: boolean;
  } = {},
): void {
  if (listing.ownerUserId !== proposerUserId) {
    throw proposedItemNotOwnedError();
  }

  const state = listing.state as ListingState;
  if (
    !ListingAvailabilityPolicy.canReceiveInteractions({
      ownerUserId: listing.ownerUserId,
      state,
      archivedAt: listing.archivedAt,
      reservationExpiresAt: listing.reservationExpiresAt,
      allowsPurchase: listing.allowsPurchase,
      allowsTrade: listing.allowsTrade,
      viewerUserId: proposerUserId,
      hasActiveMatch: input.hasActiveMatch,
      isCommittedProposedItem: input.isCommittedProposedItem,
    })
  ) {
    throw proposedItemNotAvailableError();
  }
}

import { ListingEntity } from '../../listings/domain/listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
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
): void {
  if (listing.ownerUserId === actorUserId) {
    throw selfInteractionNotAllowedError();
  }

  assertListingIsPublishedForInteractions(listing);
}

export function assertListingIsPublishedForInteractions(
  listing: ListingEntity,
): void {
  const state = listing.state as ListingState;

  if (state === ListingState.PUBLISHED && listing.archivedAt === null) {
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
): void {
  if (listing.ownerUserId !== proposerUserId) {
    throw proposedItemNotOwnedError();
  }

  const state = listing.state as ListingState;
  if (state !== ListingState.PUBLISHED || listing.archivedAt !== null) {
    throw proposedItemNotAvailableError();
  }
}

import { ListingState } from './listing-state.enum';

export const EDITABLE_LISTING_STATES = [
  ListingState.DRAFT,
  ListingState.OBSERVED,
] as const;

const EDITABLE_LISTING_STATE_SET = new Set<ListingState>(
  EDITABLE_LISTING_STATES,
);

export const TERMINAL_LISTING_STATES = [
  ListingState.CLOSED,
  ListingState.REJECTED,
  ListingState.ARCHIVED,
] as const;

export function canEditListing(state: ListingState): boolean {
  return EDITABLE_LISTING_STATE_SET.has(state);
}

export function canSubmitListingForReview(state: ListingState): boolean {
  return canEditListing(state);
}

export function canPauseListing(state: ListingState): boolean {
  return state === ListingState.PUBLISHED;
}

export function canResumeListing(state: ListingState): boolean {
  return state === ListingState.PAUSED;
}

export function canArchiveListing(state: ListingState): boolean {
  return state !== ListingState.ARCHIVED;
}

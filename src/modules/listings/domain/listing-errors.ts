import { ListingsAppError } from './listings-app.error';

export function listingNotFoundError(): ListingsAppError {
  return new ListingsAppError('LISTING_NOT_FOUND', 404, 'Listing not found');
}

export function listingNotPublishedError(): ListingsAppError {
  return new ListingsAppError(
    'LISTING_NOT_PUBLISHED',
    409,
    'The listing is not published.',
  );
}

export function listingNotAvailableError(): ListingsAppError {
  return new ListingsAppError(
    'LISTING_NOT_AVAILABLE',
    409,
    'The listing is not available for this action.',
  );
}

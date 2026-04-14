import {
  buildDiscoveryAvailableActions,
  deriveDiscoveryBadges,
  isListingDiscoverable,
} from './discovery-listing.policy';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { DiscoveryBadge } from '../domain/discovery-badge.enum';

describe('discovery-listing.policy', () => {
  it('marks published listings as discoverable only when not archived', () => {
    expect(isListingDiscoverable(ListingState.PUBLISHED, null)).toBe(true);
    expect(
      isListingDiscoverable(
        ListingState.PUBLISHED,
        new Date('2026-04-13T00:00:00Z'),
      ),
    ).toBe(false);
    expect(isListingDiscoverable(ListingState.PAUSED, null)).toBe(false);
  });

  it('derives badges from commercial configuration', () => {
    expect(deriveDiscoveryBadges(true, true)).toEqual([
      DiscoveryBadge.PURCHASE,
      DiscoveryBadge.TRADE,
    ]);
    expect(deriveDiscoveryBadges(true, false)).toEqual([
      DiscoveryBadge.PURCHASE,
    ]);
    expect(deriveDiscoveryBadges(false, true)).toEqual([DiscoveryBadge.TRADE]);
  });

  it('builds actions for a published unsaved listing', () => {
    expect(
      buildDiscoveryAvailableActions({
        isOwner: false,
        isSaved: false,
        isDismissed: false,
        allowsPurchase: true,
        allowsTrade: true,
        state: ListingState.PUBLISHED,
        archivedAt: null,
      }),
    ).toEqual({
      canBuy: true,
      canTrade: true,
      canSave: true,
      canUnsave: false,
      canDismiss: true,
    });
  });

  it('disables buyer actions for owners, dismissed items and non-published listings', () => {
    expect(
      buildDiscoveryAvailableActions({
        isOwner: true,
        isSaved: false,
        isDismissed: false,
        allowsPurchase: true,
        allowsTrade: true,
        state: ListingState.PUBLISHED,
        archivedAt: null,
      }),
    ).toEqual({
      canBuy: false,
      canTrade: false,
      canSave: false,
      canUnsave: false,
      canDismiss: false,
    });

    expect(
      buildDiscoveryAvailableActions({
        isOwner: false,
        isSaved: true,
        isDismissed: true,
        allowsPurchase: true,
        allowsTrade: false,
        state: ListingState.PUBLISHED,
        archivedAt: null,
      }),
    ).toEqual({
      canBuy: true,
      canTrade: false,
      canSave: false,
      canUnsave: true,
      canDismiss: false,
    });

    expect(
      buildDiscoveryAvailableActions({
        isOwner: false,
        isSaved: false,
        isDismissed: false,
        allowsPurchase: true,
        allowsTrade: true,
        state: ListingState.PAUSED,
        archivedAt: null,
      }),
    ).toEqual({
      canBuy: false,
      canTrade: false,
      canSave: false,
      canUnsave: false,
      canDismiss: false,
    });
  });
});

import { SavedListingsService } from './saved-listings.service';
import { ListingAvailabilityReadRepository } from '../../listings/infrastructure/listing-availability-read.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { SavedListingRepository } from '../../listings/infrastructure/saved-listing.repository';
import { FeedDismissalRepository } from '../infrastructure/feed-dismissal.repository';
import { DiscoveryFeedRepository } from '../infrastructure/discovery-feed.repository';
import { DiscoveryItemBuilder } from '../read-models/discovery-item.builder';
import { ListingState } from '../../listings/domain/listing-state.enum';

describe('SavedListingsService', () => {
  const publishedListing = {
    id: 'lst-1',
    ownerUserId: 'usr-owner',
    state: ListingState.PUBLISHED,
    allowsPurchase: true,
    allowsTrade: true,
    archivedAt: null,
  };

  const createService = () => {
    const createIfMissing = jest.fn().mockResolvedValue(true);
    const remove = jest.fn().mockResolvedValue(true);
    const exists = jest.fn().mockResolvedValue(false);
    const findSavedPage = jest.fn().mockResolvedValue([
      {
        id: 'lst-1',
        ownerUserId: 'usr-owner',
        state: ListingState.PUBLISHED,
        category: 'TOPS',
        subcategory: 'HOODIE',
        size: 'M',
        qualityScore: 86,
        approvedOrPendingPhotoCount: 2,
        allowsPurchase: true,
        allowsTrade: true,
        price: 18000,
        city: 'Rosario',
        zone: 'Centro',
        photoUrl: 'https://cdn.circular/photos/1.jpg',
        publishedAt: '2026-04-13T12:00:00.000Z',
        isSaved: true,
        isDismissed: false,
        savedAt: '2026-04-13T12:30:00.000Z',
        saveId: 'sav-1',
      },
    ]);
    const listingRepository = {
      findById: jest.fn().mockResolvedValue(publishedListing),
    } as unknown as ListingRepository;
    const savedListingRepository = {
      createIfMissing,
      remove,
    } as unknown as SavedListingRepository;
    const listingAvailabilityReadRepository = {
      getSignals: jest.fn().mockResolvedValue({
        isSaved: false,
        hasActivePurchaseIntent: false,
        hasActiveTradeProposal: false,
        hasActiveMatch: false,
        isCommittedProposedItem: false,
      }),
    } as unknown as ListingAvailabilityReadRepository;
    const feedDismissalRepository = {
      exists,
    } as unknown as FeedDismissalRepository;
    const discoveryFeedRepository = {
      findSavedPage,
    } as unknown as DiscoveryFeedRepository;
    const builder = new DiscoveryItemBuilder();

    return {
      service: new SavedListingsService(
        listingRepository,
        listingAvailabilityReadRepository,
        savedListingRepository,
        feedDismissalRepository,
        discoveryFeedRepository,
        builder,
      ),
      listingRepository,
      createIfMissing,
      remove,
      findSavedPage,
    };
  };

  it('creates a save idempotently without duplicating the relation', async () => {
    const { service, createIfMissing } = createService();
    createIfMissing.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const first = await service.save('usr-viewer', 'lst-1');
    const second = await service.save('usr-viewer', 'lst-1');

    expect(first.saved).toBe(true);
    expect(second.saved).toBe(true);
    expect(createIfMissing).toHaveBeenCalledTimes(2);
  });

  it('removes a saved listing and returns updated actions', async () => {
    const { service, remove } = createService();

    const response = await service.unsave('usr-viewer', 'lst-1');

    expect(remove).toHaveBeenCalledWith('usr-viewer', 'lst-1');
    expect(response.saved).toBe(false);
    expect(response.availableActions.canSave).toBe(true);
    expect(response.availableActions.canUnsave).toBe(false);
  });

  it('lists the current user saved discovery surface', async () => {
    const { service, findSavedPage } = createService();

    const response = await service.getMine('usr-viewer', { limit: 10 });

    expect(findSavedPage).toHaveBeenCalledWith({
      viewerUserId: 'usr-viewer',
      limit: 11,
      cursor: undefined,
    });
    expect(response.items).toHaveLength(1);
    expect(response.items[0].id).toBe('lst-1');
  });
});

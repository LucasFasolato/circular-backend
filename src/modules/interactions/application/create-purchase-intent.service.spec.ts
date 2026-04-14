import { CreatePurchaseIntentService } from './create-purchase-intent.service';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { InteractionResponseFactory } from './interaction-response.factory';
import { ListingState } from '../../listings/domain/listing-state.enum';

describe('CreatePurchaseIntentService', () => {
  const publishedListing = {
    id: 'lst-1',
    ownerUserId: 'usr-owner',
    state: ListingState.PUBLISHED,
    archivedAt: null,
  };

  function createService(overrides?: {
    listing?: Record<string, unknown>;
    activeCount?: number;
  }) {
    const createPurchaseIntent = jest.fn().mockResolvedValue({
      id: 'pi-1',
      listingId: 'lst-1',
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
    });
    const listingRepository = {
      findById: jest.fn().mockResolvedValue({
        ...publishedListing,
        ...(overrides?.listing ?? {}),
      }),
    } as unknown as ListingRepository;
    const purchaseIntentRepository = {
      countActiveByBuyerUserId: jest
        .fn()
        .mockResolvedValue(overrides?.activeCount ?? 0),
      create: createPurchaseIntent,
    } as unknown as PurchaseIntentRepository;
    const responseFactory = new InteractionResponseFactory();

    return {
      service: new CreatePurchaseIntentService(
        listingRepository,
        purchaseIntentRepository,
        responseFactory,
      ),
      listingRepository,
      createPurchaseIntent,
    };
  }

  it('creates a purchase intent over a published listing', async () => {
    const { service, createPurchaseIntent } = createService();

    const result = await service.execute('usr-buyer', 'lst-1', {
      source: 'LISTING_DETAIL',
    });

    expect(createPurchaseIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        listingId: 'lst-1',
        buyerUserId: 'usr-buyer',
        state: 'ACTIVE',
        source: 'LISTING_DETAIL',
      }),
    );
    expect(result.purchaseIntent.state).toBe('ACTIVE');
    expect(result.availableActions.canCancel).toBe(true);
  });

  it('blocks self interaction', async () => {
    const { service } = createService({
      listing: { ownerUserId: 'usr-buyer' },
    });

    await expect(
      service.execute('usr-buyer', 'lst-1', {}),
    ).rejects.toMatchObject({
      code: 'SELF_INTERACTION_NOT_ALLOWED',
    });
  });

  it('blocks purchase intent on non-published listings', async () => {
    const { service } = createService({
      listing: { state: ListingState.PAUSED },
    });

    await expect(
      service.execute('usr-buyer', 'lst-1', {}),
    ).rejects.toMatchObject({
      code: 'LISTING_NOT_PUBLISHED',
    });
  });
});

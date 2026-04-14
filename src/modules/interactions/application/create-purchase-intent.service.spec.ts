import { CreatePurchaseIntentService } from './create-purchase-intent.service';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
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
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const createPurchaseIntent = jest.fn().mockResolvedValue({
      id: 'pi-1',
      listingId: 'lst-1',
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
    });
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue({
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
    const commitmentRepository = {
      hasActiveCommitments: jest.fn().mockResolvedValue(false),
    } as unknown as ProposedListingCommitmentRepository;
    const matchSessionRepository = {
      hasActiveByListingIds: jest.fn().mockResolvedValue(false),
    } as unknown as MatchSessionRepository;
    const notifyPurchaseIntentReceived = jest.fn().mockResolvedValue(undefined);
    const notificationCommandService = {
      notifyPurchaseIntentReceived,
    } as unknown as NotificationCommandService;
    const responseFactory = new InteractionResponseFactory();

    return {
      service: new CreatePurchaseIntentService(
        { transaction } as never,
        listingRepository,
        purchaseIntentRepository,
        commitmentRepository,
        matchSessionRepository,
        responseFactory,
        notificationCommandService,
      ),
      listingRepository,
      createPurchaseIntent,
      notifyPurchaseIntentReceived,
    };
  }

  it('creates a purchase intent over a published listing', async () => {
    const { service, createPurchaseIntent, notifyPurchaseIntentReceived } =
      createService();

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
      expect.any(Object),
    );
    expect(notifyPurchaseIntentReceived).toHaveBeenCalledWith(
      {
        userId: 'usr-owner',
        listingId: 'lst-1',
        purchaseIntentId: 'pi-1',
        buyerUserId: 'usr-buyer',
      },
      expect.any(Object),
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

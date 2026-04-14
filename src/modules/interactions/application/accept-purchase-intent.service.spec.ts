import { AcceptPurchaseIntentService } from './accept-purchase-intent.service';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { InteractionConflictResolutionService } from './interaction-conflict-resolution.service';
import { MatchBootstrapService } from '../../matches/application/match-bootstrap.service';
import { InteractionResponseFactory } from './interaction-response.factory';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';

describe('AcceptPurchaseIntentService', () => {
  function createService() {
    const purchaseIntent = {
      id: 'pi-1',
      listingId: 'lst-1',
      listingOwnerUserId: 'usr-owner',
      buyerUserId: 'usr-buyer',
      state: PurchaseIntentState.ACTIVE,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
      acceptedAt: null,
      resolvedByUserId: null,
    };
    const listing = {
      id: 'lst-1',
      state: ListingState.PUBLISHED,
      archivedAt: null,
      reservationExpiresAt: null,
    };
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const dataSource = { transaction };
    const savePurchaseIntent = jest.fn(
      (entity: typeof purchaseIntent) => entity,
    );
    const saveListing = jest.fn((entity: typeof listing) => entity);
    const findActiveByListingId = jest.fn().mockResolvedValue(null);
    const expireCompetingInteractionsForListing = jest
      .fn()
      .mockResolvedValue(undefined);
    const createPurchaseMatch = jest.fn().mockResolvedValue({
      matchSessionId: 'ms-1',
      conversationThreadId: 'conv-1',
      expiresAt: new Date('2026-04-14T12:00:00.000Z'),
    });
    const purchaseIntentRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(purchaseIntent),
      save: savePurchaseIntent,
    } as unknown as PurchaseIntentRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(listing),
      save: saveListing,
    } as unknown as ListingRepository;
    const matchSessionRepository = {
      findActiveByListingId,
    } as unknown as MatchSessionRepository;
    const commitmentRepository = {
      hasActiveCommitments: jest.fn().mockResolvedValue(false),
    } as unknown as ProposedListingCommitmentRepository;
    const conflictResolution = {
      expireCompetingInteractionsForListing,
    } as unknown as InteractionConflictResolutionService;
    const matchBootstrap = {
      createPurchaseMatch,
    } as unknown as MatchBootstrapService;

    return {
      service: new AcceptPurchaseIntentService(
        dataSource as never,
        purchaseIntentRepository,
        listingRepository,
        matchSessionRepository,
        commitmentRepository,
        conflictResolution,
        matchBootstrap,
        new InteractionResponseFactory(),
      ),
      purchaseIntent,
      listing,
      expireCompetingInteractionsForListing,
      createPurchaseMatch,
    };
  }

  it('accepts an active purchase intent, reserves the listing and creates match bootstrap', async () => {
    const {
      service,
      purchaseIntent,
      listing,
      expireCompetingInteractionsForListing,
      createPurchaseMatch,
    } = createService();

    const result = await service.execute('usr-owner', 'pi-1');

    expect(purchaseIntent.state).toBe(PurchaseIntentState.ACCEPTED);
    expect(listing.state).toBe(ListingState.RESERVED);
    expect(createPurchaseMatch).toHaveBeenCalled();
    expect(expireCompetingInteractionsForListing).toHaveBeenCalledWith(
      'lst-1',
      'pi-1',
      'PURCHASE_INTENT',
      'usr-owner',
      expect.any(Object),
    );
    expect(result.matchSessionId).toBe('ms-1');
    expect(result.listing.state).toBe(ListingState.RESERVED);
  });

  it('prevents duplicate acceptance after the first resolution mutated state', async () => {
    const { service, purchaseIntent, createPurchaseMatch } = createService();

    await service.execute('usr-owner', 'pi-1');
    purchaseIntent.state = PurchaseIntentState.ACCEPTED;

    await expect(service.execute('usr-owner', 'pi-1')).rejects.toMatchObject({
      code: 'INTERACTION_NOT_ACTIVE',
    });
    expect(createPurchaseMatch).toHaveBeenCalledTimes(1);
  });
});

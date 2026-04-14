import { MatchCommandService } from './match-command.service';
import { MatchSurfaceBuilder } from '../read-models/match-surface.builder';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { PurchaseIntentRepository } from '../../interactions/infrastructure/purchase-intent.repository';
import { TradeProposalRepository } from '../../interactions/infrastructure/trade-proposal.repository';
import { ProposedListingCommitmentRepository } from '../../interactions/infrastructure/proposed-listing-commitment.repository';
import { ConversationMessageRepository } from '../infrastructure/conversation-message.repository';
import { ConversationThreadRepository } from '../infrastructure/conversation-thread.repository';
import { MatchReadRepository } from '../infrastructure/match-read.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import { MatchSessionState } from '../domain/match-session-state.enum';
import { MatchType } from '../domain/match-type.enum';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { PurchaseIntentState } from '../../interactions/domain/purchase-intent-state.enum';

describe('MatchCommandService', () => {
  function createService() {
    const transaction = jest.fn((cb: (manager: object) => Promise<unknown>) =>
      cb({}),
    );
    const dataSource = { transaction };
    const match = {
      id: 'ms-1',
      state: MatchSessionState.OPEN,
      listingId: 'lst-1',
      ownerUserId: 'usr-owner',
      counterpartyUserId: 'usr-buyer',
      expiresAt: new Date(Date.now() + 60_000),
      successConfirmedByOwnerAt: null,
      successConfirmedByCounterpartyAt: new Date('2026-04-13T12:00:00.000Z'),
      originPurchaseIntentId: 'pi-1',
      originTradeProposalId: null,
      completedAt: null,
      failedAt: null,
      cancelledAt: null,
      closedAt: null,
    };
    const listing = {
      id: 'lst-1',
      state: ListingState.RESERVED,
      reservationExpiresAt: new Date(Date.now() + 60_000),
      closedAt: null,
    };
    const conversation = {
      id: 'conv-1',
      matchSessionId: 'ms-1',
      state: ConversationThreadState.OPEN,
      restrictedAt: null,
      closedAt: null,
    };
    const purchaseIntent = {
      id: 'pi-1',
      state: PurchaseIntentState.ACCEPTED,
      closedAt: null,
    };
    const matchSessionRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(match),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findExpiredActiveIds: jest.fn().mockResolvedValue([]),
    } as unknown as MatchSessionRepository;
    const conversationThreadRepository = {
      findByMatchSessionIdForUpdate: jest.fn().mockResolvedValue(conversation),
      findByIdForUpdate: jest.fn().mockResolvedValue(conversation),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as ConversationThreadRepository;
    const conversationMessageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as ConversationMessageRepository;
    const matchReadRepository = {
      findMatchByIdForViewer: jest.fn().mockResolvedValue({
        id: 'ms-1',
        state: MatchSessionState.COMPLETED,
        type: MatchType.PURCHASE,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        ownerUserId: 'usr-owner',
        counterpartyUserId: 'usr-buyer',
        successConfirmedByOwnerAt: new Date().toISOString(),
        successConfirmedByCounterpartyAt: new Date().toISOString(),
        listing: {
          id: 'lst-1',
          photo: null,
          category: 'TOPS',
          size: 'M',
          state: ListingState.CLOSED,
        },
        counterparty: {
          id: 'usr-buyer',
          firstName: 'Bruno',
          instagramHandle: null,
        },
        conversation: {
          id: 'conv-1',
          state: ConversationThreadState.RESTRICTED,
        },
        createdAt: new Date().toISOString(),
      }),
      findMatchByConversationIdForViewer: jest.fn(),
    } as unknown as MatchReadRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(listing),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as ListingRepository;
    const purchaseIntentRepository = {
      findById: jest.fn().mockResolvedValue(purchaseIntent),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as PurchaseIntentRepository;
    const tradeProposalRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as TradeProposalRepository;
    const releaseByMatchSessionId = jest.fn().mockResolvedValue(undefined);
    const proposedListingCommitmentRepository = {
      releaseByMatchSessionId,
    } as unknown as ProposedListingCommitmentRepository;

    return {
      service: new MatchCommandService(
        dataSource as never,
        matchSessionRepository,
        conversationThreadRepository,
        conversationMessageRepository,
        matchReadRepository,
        new MatchSurfaceBuilder(),
        listingRepository,
        purchaseIntentRepository,
        tradeProposalRepository,
        proposedListingCommitmentRepository,
      ),
      match,
      listing,
      conversation,
      purchaseIntent,
      releaseByMatchSessionId,
    };
  }

  it('completes the match when the second party confirms success', async () => {
    const {
      service,
      match,
      listing,
      conversation,
      purchaseIntent,
      releaseByMatchSessionId,
    } = createService();

    const response = await service.confirmSuccess('usr-owner', 'ms-1');

    expect(match.state).toBe(MatchSessionState.COMPLETED);
    expect(listing.state).toBe(ListingState.CLOSED);
    expect(conversation.state).toBe(ConversationThreadState.RESTRICTED);
    expect(purchaseIntent.state).toBe(PurchaseIntentState.CLOSED);
    expect(releaseByMatchSessionId).toHaveBeenCalledWith(
      'ms-1',
      expect.any(Object),
    );
    expect(response.matchSession.state).toBe(MatchSessionState.COMPLETED);
    expect(response.listingState).toBe(ListingState.CLOSED);
  });
});

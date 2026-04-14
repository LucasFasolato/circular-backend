import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { PurchaseIntentState } from '../../interactions/domain/purchase-intent-state.enum';
import { ProposedListingCommitmentRepository } from '../../interactions/infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../../interactions/infrastructure/purchase-intent.repository';
import { TradeProposalRepository } from '../../interactions/infrastructure/trade-proposal.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import { MatchSessionState } from '../domain/match-session-state.enum';
import { ConversationThreadRepository } from '../infrastructure/conversation-thread.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';
import { MatchExpirationService } from './match-expiration.service';

describe('MatchExpirationService', () => {
  function createService() {
    const now = new Date('2026-04-14T12:00:00.000Z');
    const transaction = jest.fn((cb: (manager: object) => Promise<unknown>) =>
      cb({}),
    );
    const dataSource = { transaction };

    const findExpiredActiveIdsMock = jest.fn();
    const findByIdForUpdateMock = jest.fn();
    const saveMatchMock = jest
      .fn()
      .mockImplementation((entity) => Promise.resolve(entity));
    const findConversationForUpdateMock = jest.fn();
    const saveConversationMock = jest
      .fn()
      .mockImplementation((entity) => Promise.resolve(entity));
    const findListingForUpdateMock = jest.fn();
    const saveListingMock = jest
      .fn()
      .mockImplementation((entity) => Promise.resolve(entity));
    const findPurchaseIntentByIdMock = jest.fn();
    const savePurchaseIntentMock = jest
      .fn()
      .mockImplementation((entity) => Promise.resolve(entity));
    const findTradeProposalByIdMock = jest.fn();
    const saveTradeProposalMock = jest
      .fn()
      .mockImplementation((entity) => Promise.resolve(entity));
    const findActiveCommitmentsForUpdateMock = jest.fn().mockResolvedValue([]);
    const releaseByMatchSessionIdMock = jest.fn().mockResolvedValue(undefined);
    const notifyReservationExpiredMock = jest.fn().mockResolvedValue(undefined);

    const matchSessionRepository = {
      findExpiredActiveIds: findExpiredActiveIdsMock,
      findByIdForUpdate: findByIdForUpdateMock,
      save: saveMatchMock,
    } as unknown as MatchSessionRepository;
    const conversationThreadRepository = {
      findByMatchSessionIdForUpdate: findConversationForUpdateMock,
      save: saveConversationMock,
    } as unknown as ConversationThreadRepository;
    const listingRepository = {
      findByIdForUpdate: findListingForUpdateMock,
      save: saveListingMock,
    } as unknown as ListingRepository;
    const purchaseIntentRepository = {
      findById: findPurchaseIntentByIdMock,
      save: savePurchaseIntentMock,
    } as unknown as PurchaseIntentRepository;
    const tradeProposalRepository = {
      findById: findTradeProposalByIdMock,
      save: saveTradeProposalMock,
    } as unknown as TradeProposalRepository;
    const proposedListingCommitmentRepository = {
      findActiveByMatchSessionIdForUpdate: findActiveCommitmentsForUpdateMock,
      releaseByMatchSessionId: releaseByMatchSessionIdMock,
    } as unknown as ProposedListingCommitmentRepository;
    const notificationCommandService = {
      notifyReservationExpired: notifyReservationExpiredMock,
    } as unknown as NotificationCommandService;

    const service = new MatchExpirationService(
      dataSource as never,
      matchSessionRepository,
      conversationThreadRepository,
      listingRepository,
      notificationCommandService,
      purchaseIntentRepository,
      tradeProposalRepository,
      proposedListingCommitmentRepository,
    );

    return {
      service,
      now,
      findExpiredActiveIdsMock,
      findByIdForUpdateMock,
      findConversationForUpdateMock,
      findListingForUpdateMock,
      findPurchaseIntentByIdMock,
      findActiveCommitmentsForUpdateMock,
      releaseByMatchSessionIdMock,
      notifyReservationExpiredMock,
    };
  }

  function createExpiredFixture(
    state: MatchSessionState = MatchSessionState.OPEN,
  ) {
    return {
      match: {
        id: 'ms-1',
        state,
        listingId: 'lst-1',
        originPurchaseIntentId: 'pi-1',
        originTradeProposalId: null,
        expiresAt: new Date('2026-04-14T11:00:00.000Z'),
        failedAt: null,
        cancelledAt: null,
        completedAt: null,
        closedAt: null,
        successConfirmedByOwnerAt: new Date('2026-04-14T10:55:00.000Z'),
        successConfirmedByCounterpartyAt: null,
      },
      listing: {
        id: 'lst-1',
        state: ListingState.RESERVED,
        reservationExpiresAt: new Date('2026-04-14T11:00:00.000Z'),
      },
      conversation: {
        id: 'conv-1',
        state: ConversationThreadState.OPEN,
        closedAt: null,
      },
      purchaseIntent: {
        id: 'pi-1',
        state: PurchaseIntentState.ACCEPTED,
        closedAt: null,
      },
    };
  }

  it('expires an overdue OPEN match and republishes the listing', async () => {
    const {
      service,
      now,
      releaseByMatchSessionIdMock,
      findPurchaseIntentByIdMock,
      notifyReservationExpiredMock,
    } = createService();
    const { match, listing, conversation, purchaseIntent } =
      createExpiredFixture(MatchSessionState.OPEN);
    findPurchaseIntentByIdMock.mockResolvedValue(purchaseIntent as never);

    const expired = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(expired).toBe(true);
    expect(match.state).toBe(MatchSessionState.EXPIRED);
    expect(listing.state).toBe(ListingState.PUBLISHED);
    expect(listing.reservationExpiresAt).toBeNull();
    expect(conversation.state).toBe(ConversationThreadState.CLOSED);
    expect(conversation.closedAt).toEqual(now);
    expect(purchaseIntent.state).toBe(PurchaseIntentState.CLOSED);
    expect(releaseByMatchSessionIdMock).toHaveBeenCalledWith(
      'ms-1',
      expect.any(Object),
    );
    expect(notifyReservationExpiredMock).toHaveBeenCalledTimes(2);
  });

  it('expires an overdue ACTIVE match with the same operational cleanup', async () => {
    const { service, now, releaseByMatchSessionIdMock } = createService();
    const { match, listing, conversation } = createExpiredFixture(
      MatchSessionState.ACTIVE,
    );

    const expired = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(expired).toBe(true);
    expect(match.state).toBe(MatchSessionState.EXPIRED);
    expect(conversation.state).toBe(ConversationThreadState.CLOSED);
    expect(releaseByMatchSessionIdMock).toHaveBeenCalledTimes(1);
  });

  it('does not touch a match that has not expired yet', async () => {
    const { service, now, releaseByMatchSessionIdMock } = createService();
    const { match, listing, conversation } = createExpiredFixture();
    match.expiresAt = new Date('2026-04-14T13:00:00.000Z');

    const expired = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(expired).toBe(false);
    expect(match.state).toBe(MatchSessionState.OPEN);
    expect(listing.state).toBe(ListingState.RESERVED);
    expect(releaseByMatchSessionIdMock).not.toHaveBeenCalled();
  });

  it('does not touch a COMPLETED match', async () => {
    const { service, now } = createService();
    const { match, listing, conversation } = createExpiredFixture();
    match.state = MatchSessionState.COMPLETED;

    const expired = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(expired).toBe(false);
    expect(match.state).toBe(MatchSessionState.COMPLETED);
    expect(conversation.state).toBe(ConversationThreadState.OPEN);
  });

  it('does not republish a listing already in a terminal incompatible state', async () => {
    const { service, now } = createService();
    const { match, listing, conversation } = createExpiredFixture();
    listing.state = ListingState.CLOSED;

    const expired = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(expired).toBe(true);
    expect(listing.state).toBe(ListingState.CLOSED);
    expect(listing.reservationExpiresAt).toBeNull();
    expect(conversation.state).toBe(ConversationThreadState.CLOSED);
  });

  it('is idempotent when trying to expire the same match twice', async () => {
    const { service, now } = createService();
    const { match, listing, conversation } = createExpiredFixture();

    const first = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });
    const second = await service.expireLockedMatchIfDue({
      match: match as never,
      listing: listing as never,
      conversation: conversation as never,
      manager: {} as never,
      now,
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(match.state).toBe(MatchSessionState.EXPIRED);
  });

  it('processes a batch of overdue matches and skips already resolved rows after revalidation', async () => {
    const {
      service,
      now,
      findExpiredActiveIdsMock,
      findByIdForUpdateMock,
      findListingForUpdateMock,
      findConversationForUpdateMock,
      findActiveCommitmentsForUpdateMock,
    } = createService();
    const first = createExpiredFixture(MatchSessionState.OPEN);
    const second = createExpiredFixture(MatchSessionState.ACTIVE);
    second.match.id = 'ms-2';
    second.match.listingId = 'lst-2';
    second.listing.id = 'lst-2';
    second.conversation.id = 'conv-2';

    findExpiredActiveIdsMock.mockResolvedValue(['ms-1', 'ms-2', 'ms-3']);
    findByIdForUpdateMock.mockImplementation((id: string) => {
      if (id === 'ms-1') {
        return first.match as never;
      }
      if (id === 'ms-2') {
        return second.match as never;
      }

      return {
        ...first.match,
        id,
        state: MatchSessionState.EXPIRED,
      } as never;
    });
    findListingForUpdateMock.mockImplementation((id: string) => {
      if (id === 'lst-2') {
        return second.listing as never;
      }

      return first.listing as never;
    });
    findConversationForUpdateMock.mockImplementation((id: string) => {
      if (id === 'ms-2') {
        return second.conversation as never;
      }

      return first.conversation as never;
    });

    const result = await service.expireDueMatches({ now, batchSize: 10 });

    expect(result).toEqual({
      processedCount: 3,
      expiredCount: 2,
      skippedCount: 1,
      errorsCount: 0,
    });
    expect(findActiveCommitmentsForUpdateMock).toHaveBeenCalledTimes(3);
    expect(first.match.state).toBe(MatchSessionState.EXPIRED);
    expect(second.match.state).toBe(MatchSessionState.EXPIRED);
  });
});

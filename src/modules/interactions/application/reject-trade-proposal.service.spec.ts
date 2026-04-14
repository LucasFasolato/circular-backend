import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { RejectTradeProposalService } from './reject-trade-proposal.service';
import { InteractionResponseFactory } from './interaction-response.factory';

describe('RejectTradeProposalService', () => {
  it('rejects an active trade proposal and notifies the proposer', async () => {
    const tradeProposal = {
      id: 'tp-1',
      targetListingId: 'lst-1',
      targetListingOwnerUserId: 'usr-owner',
      proposerUserId: 'usr-proposer',
      state: TradeProposalState.ACTIVE,
      rejectedAt: null,
      resolvedByUserId: null,
    };
    const listing = {
      id: 'lst-1',
      state: 'PUBLISHED',
      reservationExpiresAt: null,
    };
    const dataSource = {
      transaction: jest.fn((cb: (manager: object) => unknown) => cb({})),
    };
    const tradeProposalRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(tradeProposal),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as TradeProposalRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(listing),
    } as unknown as ListingRepository;
    const notifyInteractionRejected = jest.fn().mockResolvedValue(undefined);
    const notificationCommandService = {
      notifyInteractionRejected,
    } as unknown as NotificationCommandService;

    const service = new RejectTradeProposalService(
      dataSource as never,
      tradeProposalRepository,
      listingRepository,
      new InteractionResponseFactory(),
      notificationCommandService,
    );

    const result = await service.execute('usr-owner', 'tp-1');

    expect(tradeProposal.state).toBe(TradeProposalState.REJECTED);
    expect(notifyInteractionRejected).toHaveBeenCalledWith(
      {
        userId: 'usr-proposer',
        listingId: 'lst-1',
        interactionId: 'tp-1',
        interactionType: 'TRADE_PROPOSAL',
      },
      expect.any(Object),
    );
    expect(result.state).toBe(TradeProposalState.REJECTED);
  });
});

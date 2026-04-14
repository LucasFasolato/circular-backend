import { CancelTradeProposalService } from './cancel-trade-proposal.service';
import { RejectTradeProposalService } from './reject-trade-proposal.service';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { InteractionResponseFactory } from './interaction-response.factory';
import { ListingState } from '../../listings/domain/listing-state.enum';

describe('trade proposal resolution services', () => {
  it('cancels an active trade proposal for its proposer', async () => {
    const tradeProposal = {
      id: 'tp-1',
      targetListingId: 'lst-1',
      proposerUserId: 'usr-proposer',
      state: TradeProposalState.ACTIVE,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
    };
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const repository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(tradeProposal),
      save: jest.fn((entity: typeof tradeProposal) => entity),
    } as unknown as TradeProposalRepository;
    const itemRepository = {
      findByTradeProposalId: jest
        .fn()
        .mockResolvedValue([{ proposedListingId: 'lst-proposed' }]),
    } as unknown as TradeProposalItemRepository;
    const service = new CancelTradeProposalService(
      { transaction } as never,
      repository,
      itemRepository,
      new InteractionResponseFactory(),
    );

    const result = await service.execute('usr-proposer', 'tp-1');

    expect(result.tradeProposal.state).toBe(TradeProposalState.CANCELLED);
    expect(result.availableActions.canCancel).toBe(false);
  });

  it('rejects an active trade proposal for the listing owner', async () => {
    const tradeProposal = {
      id: 'tp-1',
      targetListingId: 'lst-1',
      targetListingOwnerUserId: 'usr-owner',
      state: TradeProposalState.ACTIVE,
    };
    const listing = {
      id: 'lst-1',
      state: ListingState.PUBLISHED,
      reservationExpiresAt: null,
    };
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const repository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(tradeProposal),
      save: jest.fn((entity: typeof tradeProposal) => entity),
    } as unknown as TradeProposalRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(listing),
    } as unknown as ListingRepository;
    const service = new RejectTradeProposalService(
      { transaction } as never,
      repository,
      listingRepository,
      new InteractionResponseFactory(),
    );

    const result = await service.execute('usr-owner', 'tp-1');

    expect(result.state).toBe(TradeProposalState.REJECTED);
    expect(result.matchSessionId).toBeNull();
  });
});

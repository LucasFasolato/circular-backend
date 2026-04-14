import { CancelTradeProposalService } from './cancel-trade-proposal.service';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { InteractionResponseFactory } from './interaction-response.factory';

describe('CancelTradeProposalService', () => {
  it('cancels an active trade proposal and returns the current proposed items', async () => {
    const tradeProposal = {
      id: 'tp-1',
      targetListingId: 'lst-target',
      proposerUserId: 'usr-proposer',
      state: TradeProposalState.ACTIVE,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
      cancelledAt: null,
    };

    const service = new CancelTradeProposalService(
      {
        transaction: jest.fn((cb: (manager: object) => unknown) => cb({})),
      } as never,
      {
        findByIdForUpdate: jest.fn().mockResolvedValue(tradeProposal),
        save: jest
          .fn()
          .mockImplementation((entity: typeof tradeProposal) => entity),
      } as unknown as TradeProposalRepository,
      {
        findByTradeProposalId: jest
          .fn()
          .mockResolvedValue([
            { proposedListingId: 'lst-proposed-1' },
            { proposedListingId: 'lst-proposed-2' },
          ]),
      } as unknown as TradeProposalItemRepository,
      new InteractionResponseFactory(),
    );

    const result = await service.execute('usr-proposer', 'tp-1');

    expect(tradeProposal.state).toBe(TradeProposalState.CANCELLED);
    expect(result.tradeProposal.proposedListingIds).toEqual([
      'lst-proposed-1',
      'lst-proposed-2',
    ]);
    expect(result.availableActions.canCancel).toBe(false);
  });
});

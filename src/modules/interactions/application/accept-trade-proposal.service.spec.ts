import { AcceptTradeProposalService } from './accept-trade-proposal.service';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';
import { InteractionConflictResolutionService } from './interaction-conflict-resolution.service';
import { MatchBootstrapService } from './match-bootstrap.service';
import { InteractionResponseFactory } from './interaction-response.factory';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';

describe('AcceptTradeProposalService', () => {
  function createService() {
    const tradeProposal = {
      id: 'tp-1',
      targetListingId: 'lst-target',
      proposerUserId: 'usr-proposer',
      targetListingOwnerUserId: 'usr-owner',
      state: TradeProposalState.ACTIVE,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
      acceptedAt: null,
      resolvedByUserId: null,
    };
    const targetListing = {
      id: 'lst-target',
      state: ListingState.PUBLISHED,
      archivedAt: null,
      reservationExpiresAt: null,
    };
    const proposedListing = {
      id: 'lst-proposed',
      ownerUserId: 'usr-proposer',
      state: ListingState.PUBLISHED,
      archivedAt: null,
    };

    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const dataSource = { transaction };
    const saveTradeProposal = jest.fn((entity: typeof tradeProposal) => entity);
    const saveListing = jest.fn((entity: typeof targetListing) => entity);
    const createManyCommitments = jest.fn().mockResolvedValue([]);
    const expireCompetingInteractionsForListing = jest
      .fn()
      .mockResolvedValue(undefined);
    const expireTradeProposalsUsingUnavailableProposedItems = jest
      .fn()
      .mockResolvedValue(undefined);
    const tradeProposalRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(tradeProposal),
      save: saveTradeProposal,
    } as unknown as TradeProposalRepository;
    const tradeProposalItemRepository = {
      findByTradeProposalId: jest
        .fn()
        .mockResolvedValue([{ proposedListingId: 'lst-proposed' }]),
    } as unknown as TradeProposalItemRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(targetListing),
      findManyByIdsForUpdate: jest.fn().mockResolvedValue([proposedListing]),
      save: saveListing,
    } as unknown as ListingRepository;
    const commitmentRepository = {
      hasActiveCommitments: jest.fn().mockResolvedValue(false),
      createMany: createManyCommitments,
    } as unknown as ProposedListingCommitmentRepository;
    const matchSessionRepository = {
      findActiveByListingId: jest.fn().mockResolvedValue(null),
    } as unknown as MatchSessionRepository;
    const conflictResolution = {
      expireCompetingInteractionsForListing,
      expireTradeProposalsUsingUnavailableProposedItems,
    } as unknown as InteractionConflictResolutionService;
    const matchBootstrap = {
      createTradeMatch: jest.fn().mockResolvedValue({
        matchSessionId: 'ms-1',
        conversationThreadId: 'conv-1',
        expiresAt: new Date('2026-04-14T12:00:00.000Z'),
      }),
    } as unknown as MatchBootstrapService;

    return {
      service: new AcceptTradeProposalService(
        dataSource as never,
        tradeProposalRepository,
        tradeProposalItemRepository,
        listingRepository,
        commitmentRepository,
        matchSessionRepository,
        conflictResolution,
        matchBootstrap,
        new InteractionResponseFactory(),
      ),
      tradeProposal,
      targetListing,
      createManyCommitments,
      expireTradeProposalsUsingUnavailableProposedItems,
    };
  }

  it('accepts a trade proposal, reserves the target listing and commits proposed items', async () => {
    const {
      service,
      tradeProposal,
      targetListing,
      createManyCommitments,
      expireTradeProposalsUsingUnavailableProposedItems,
    } = createService();

    const result = await service.execute('usr-owner', 'tp-1');

    expect(tradeProposal.state).toBe(TradeProposalState.ACCEPTED);
    expect(targetListing.state).toBe(ListingState.RESERVED);
    expect(createManyCommitments).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          proposedListingId: 'lst-proposed',
          tradeProposalId: 'tp-1',
          matchSessionId: 'ms-1',
          state: 'COMMITTED_TO_MATCH',
        }),
      ],
      expect.any(Object),
    );
    expect(
      expireTradeProposalsUsingUnavailableProposedItems,
    ).toHaveBeenCalledWith(
      ['lst-proposed', 'lst-target'],
      'tp-1',
      'usr-owner',
      expect.any(Object),
    );
    expect(result.matchSessionId).toBe('ms-1');
  });
});

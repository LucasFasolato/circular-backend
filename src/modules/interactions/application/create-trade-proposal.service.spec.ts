import { CreateTradeProposalService } from './create-trade-proposal.service';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { InteractionResponseFactory } from './interaction-response.factory';
import { ListingState } from '../../listings/domain/listing-state.enum';

describe('CreateTradeProposalService', () => {
  const targetListing = {
    id: 'lst-target',
    ownerUserId: 'usr-owner',
    state: ListingState.PUBLISHED,
    archivedAt: null,
  };
  const proposedListing = {
    id: 'lst-proposed',
    ownerUserId: 'usr-proposer',
    state: ListingState.PUBLISHED,
    archivedAt: null,
  };

  function createService(overrides?: {
    proposedListing?: Record<string, unknown>;
    hasCommitments?: boolean;
  }) {
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const dataSource = { transaction };
    const createManyTradeProposalItems = jest.fn().mockResolvedValue([]);
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(targetListing),
      findManyByIdsForUpdate: jest
        .fn()
        .mockResolvedValue([
          { ...proposedListing, ...(overrides?.proposedListing ?? {}) },
        ]),
    } as unknown as ListingRepository;
    const tradeProposalRepository = {
      countActiveByProposerUserId: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: 'tp-1',
        createdAt: new Date('2026-04-13T12:00:00.000Z'),
      }),
    } as unknown as TradeProposalRepository;
    const tradeProposalItemRepository = {
      createMany: createManyTradeProposalItems,
    } as unknown as TradeProposalItemRepository;
    const commitmentRepository = {
      hasActiveCommitments: jest
        .fn()
        .mockImplementation((listingIds: string[]) =>
          Promise.resolve(
            listingIds.includes('lst-target')
              ? false
              : (overrides?.hasCommitments ?? false),
          ),
        ),
    } as unknown as ProposedListingCommitmentRepository;
    const matchSessionRepository = {
      hasActiveByListingIds: jest.fn().mockResolvedValue(false),
    } as unknown as MatchSessionRepository;
    const notifyTradeProposalReceived = jest.fn().mockResolvedValue(undefined);
    const notificationCommandService = {
      notifyTradeProposalReceived,
    } as unknown as NotificationCommandService;

    return {
      service: new CreateTradeProposalService(
        dataSource as never,
        listingRepository,
        tradeProposalRepository,
        tradeProposalItemRepository,
        commitmentRepository,
        matchSessionRepository,
        new InteractionResponseFactory(),
        notificationCommandService,
      ),
      createManyTradeProposalItems,
      notifyTradeProposalReceived,
    };
  }

  it('creates a valid 1:N trade proposal', async () => {
    const {
      service,
      createManyTradeProposalItems,
      notifyTradeProposalReceived,
    } = createService();

    const result = await service.execute('usr-proposer', 'lst-target', {
      source: 'LISTING_DETAIL',
      proposedListingIds: ['lst-proposed'],
    });

    expect(createManyTradeProposalItems).toHaveBeenCalledWith(
      [{ tradeProposalId: 'tp-1', proposedListingId: 'lst-proposed' }],
      expect.any(Object),
    );
    expect(notifyTradeProposalReceived).toHaveBeenCalledWith(
      {
        userId: 'usr-owner',
        listingId: 'lst-target',
        tradeProposalId: 'tp-1',
        proposerUserId: 'usr-proposer',
        proposedListingIds: ['lst-proposed'],
      },
      expect.any(Object),
    );
    expect(result.tradeProposal.state).toBe('ACTIVE');
    expect(result.tradeProposal.proposedListingIds).toEqual(['lst-proposed']);
  });

  it('fails if a proposed item is not owned by the proposer', async () => {
    const { service } = createService({
      proposedListing: { ownerUserId: 'usr-someone-else' },
    });

    await expect(
      service.execute('usr-proposer', 'lst-target', {
        proposedListingIds: ['lst-proposed'],
      }),
    ).rejects.toMatchObject({
      code: 'PROPOSED_ITEM_NOT_OWNED',
    });
  });

  it('fails if a proposed item is already committed', async () => {
    const { service } = createService({ hasCommitments: true });

    await expect(
      service.execute('usr-proposer', 'lst-target', {
        proposedListingIds: ['lst-proposed'],
      }),
    ).rejects.toMatchObject({
      code: 'PROPOSED_ITEM_ALREADY_COMMITTED',
    });
  });

  it('fails if a proposed item is not available', async () => {
    const { service } = createService({
      proposedListing: { state: ListingState.RESERVED },
    });

    await expect(
      service.execute('usr-proposer', 'lst-target', {
        proposedListingIds: ['lst-proposed'],
      }),
    ).rejects.toMatchObject({
      code: 'PROPOSED_ITEM_NOT_AVAILABLE',
    });
  });
});

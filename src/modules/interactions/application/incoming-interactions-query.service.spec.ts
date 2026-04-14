import { IncomingInteractionsQueryService } from './incoming-interactions-query.service';
import { InteractionType } from '../domain/interaction-type.enum';
import { IncomingInteractionsReadRepository } from '../infrastructure/incoming-interactions-read.repository';
import { IncomingInteractionItemBuilder } from '../read-models/incoming-interaction-item.builder';
import { IncomingInteractionsTypeFilter } from '../presentation/dto/list-incoming-interactions-query.dto';

describe('IncomingInteractionsQueryService', () => {
  it('returns incoming interactions and builds a stable cursor', async () => {
    const findIncomingPage = jest.fn().mockResolvedValue([
      {
        interactionType: InteractionType.TRADE_PROPOSAL,
        id: 'tp-2',
        state: 'ACTIVE',
        createdAt: '2026-04-13T12:00:00.000Z',
        targetListing: {
          id: 'lst-1',
          photo: 'https://cdn.circular/photos/1.jpg',
          category: 'TOPS',
          size: 'M',
        },
        interestedUser: {
          id: 'usr-2',
          firstName: 'Sofi',
          trust: {
            completedTransactions: 5,
            successRate: 0.8,
            avgResponseTimeHours: 2,
          },
        },
        proposedItems: [
          {
            id: 'lst-proposed',
            photo: null,
            category: 'OUTERWEAR',
            size: 'M',
          },
        ],
      },
      {
        interactionType: InteractionType.PURCHASE_INTENT,
        id: 'pi-1',
        state: 'ACTIVE',
        createdAt: '2026-04-13T11:00:00.000Z',
        targetListing: {
          id: 'lst-1',
          photo: 'https://cdn.circular/photos/1.jpg',
          category: 'TOPS',
          size: 'M',
        },
        interestedUser: {
          id: 'usr-3',
          firstName: 'Luca',
          trust: {
            completedTransactions: 3,
            successRate: 1,
            avgResponseTimeHours: 1,
          },
        },
        proposedItems: null,
      },
    ]);
    const repository = {
      findIncomingPage,
    } as unknown as IncomingInteractionsReadRepository;
    const service = new IncomingInteractionsQueryService(
      repository,
      new IncomingInteractionItemBuilder(),
    );

    const result = await service.execute('usr-owner', {
      type: IncomingInteractionsTypeFilter.ALL,
      limit: 1,
    });

    expect(findIncomingPage).toHaveBeenCalledWith({
      ownerUserId: 'usr-owner',
      type: IncomingInteractionsTypeFilter.ALL,
      limit: 2,
      cursor: undefined,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].interactionType).toBe(
      InteractionType.TRADE_PROPOSAL,
    );
    expect(result.__meta.nextCursor).toEqual(expect.any(String));
  });

  it('forwards the requested type filter to the repository', async () => {
    const findIncomingPage = jest.fn().mockResolvedValue([]);
    const service = new IncomingInteractionsQueryService(
      {
        findIncomingPage,
      } as unknown as IncomingInteractionsReadRepository,
      new IncomingInteractionItemBuilder(),
    );

    await service.execute('usr-owner', {
      type: IncomingInteractionsTypeFilter.PURCHASE,
      limit: 10,
    });

    expect(findIncomingPage).toHaveBeenCalledWith({
      ownerUserId: 'usr-owner',
      type: IncomingInteractionsTypeFilter.PURCHASE,
      limit: 11,
      cursor: undefined,
    });
  });
});

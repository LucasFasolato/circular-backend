import { DiscoveryFeedQueryService } from './discovery-feed-query.service';
import { DiscoveryFeedRepository } from '../infrastructure/discovery-feed.repository';
import { DiscoveryItemBuilder } from '../read-models/discovery-item.builder';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { DiscoveryFeedMode } from '../domain/discovery-feed-mode.enum';

describe('DiscoveryFeedQueryService', () => {
  const makeSnapshot = (id: string, publishedAt: string) => ({
    id,
    state: ListingState.PUBLISHED,
    category: 'TOPS',
    subcategory: 'HOODIE',
    size: 'M',
    qualityScore: 86,
    approvedOrPendingPhotoCount: 2,
    allowsPurchase: true,
    allowsTrade: true,
    price: 18000,
    city: 'Rosario',
    zone: 'Centro',
    photoUrl: 'https://cdn.circular/photos/1.jpg',
    publishedAt,
    isSaved: false,
    isDismissed: false,
  });

  it('builds a stable cursor and avoids duplicates across pages', async () => {
    const findFeedPage = jest
      .fn()
      .mockImplementation(
        ({
          cursor,
          limit,
        }: {
          cursor?: { publishedAt: string; id: string };
          limit: number;
        }) => {
          if (!cursor) {
            return Promise.resolve(
              [
                makeSnapshot('lst-3', '2026-04-13T12:00:00.000Z'),
                makeSnapshot('lst-2', '2026-04-13T11:00:00.000Z'),
                makeSnapshot('lst-1', '2026-04-13T10:00:00.000Z'),
              ].slice(0, limit),
            );
          }

          return Promise.resolve(
            [makeSnapshot('lst-1', '2026-04-13T10:00:00.000Z')].slice(0, limit),
          );
        },
      );
    const repository = {
      findFeedPage,
    } as unknown as DiscoveryFeedRepository;
    const builder = new DiscoveryItemBuilder();
    const service = new DiscoveryFeedQueryService(repository, builder);

    const firstPage = await service.getSwipeFeed('usr-1', {
      limit: 2,
      mode: DiscoveryFeedMode.BOTH,
    });

    expect(firstPage.items.map((item) => item.id)).toEqual(['lst-3', 'lst-2']);
    expect(firstPage.__meta.nextCursor).toEqual(expect.any(String));

    const secondPage = await service.getSwipeFeed('usr-1', {
      limit: 2,
      cursor: firstPage.__meta.nextCursor as string,
    });

    expect(secondPage.items.map((item) => item.id)).toEqual(['lst-1']);
    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
    expect(findFeedPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        cursor: {
          publishedAt: '2026-04-13T11:00:00.000Z',
          id: 'lst-2',
        },
      }),
    );
  });
});

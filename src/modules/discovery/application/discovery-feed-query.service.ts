import {
  decodeCursor,
  encodeCursor,
} from '../../../common/application/cursor-pagination';
import { withResponseMeta } from '../../../common/application/response-meta';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { Injectable } from '@nestjs/common';
import { LISTING_LIMITS } from '../../listings/domain/listing-limits.constants';
import {
  DiscoveryFeedCursor,
  DiscoveryFeedRepository,
} from '../infrastructure/discovery-feed.repository';
import { GetDiscoveryFeedQueryDto } from '../presentation/dto/get-discovery-feed-query.dto';
import { DiscoveryFeedResponseDto } from '../presentation/dto/discovery-feed.response.dto';
import { DiscoveryItemBuilder } from '../read-models/discovery-item.builder';

@Injectable()
export class DiscoveryFeedQueryService {
  constructor(
    private readonly discoveryFeedRepository: DiscoveryFeedRepository,
    private readonly discoveryItemBuilder: DiscoveryItemBuilder,
  ) {}

  async getSwipeFeed(viewerUserId: string, query: GetDiscoveryFeedQueryDto) {
    const limit = query.limit ?? LISTING_LIMITS.DEFAULT_LIST_LIMIT;
    const cursor = query.cursor
      ? this.decodeFeedCursor(query.cursor)
      : undefined;
    const listings = await this.discoveryFeedRepository.findFeedPage({
      viewerUserId,
      limit: limit + 1,
      category: query.category,
      size: query.size,
      city: query.city,
      zone: query.zone,
      mode: query.mode,
      cursor,
    });

    const hasMore = listings.length > limit;
    const pageItems = hasMore ? listings.slice(0, limit) : listings;
    const items = pageItems.map((item) =>
      this.discoveryItemBuilder.buildFeedItem(item),
    );
    const lastItem = pageItems.at(-1);

    return withResponseMeta<DiscoveryFeedResponseDto>(
      {
        items,
      },
      {
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                publishedAt: lastItem.publishedAt,
                id: lastItem.id,
              })
            : null,
      },
    );
  }

  private decodeFeedCursor(cursor: string): DiscoveryFeedCursor {
    const parsed = decodeCursor<Partial<DiscoveryFeedCursor>>(cursor);

    if (
      typeof parsed.publishedAt !== 'string' ||
      parsed.publishedAt.length === 0 ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    ) {
      throw new ValidationAppError('Invalid cursor', [
        { field: 'cursor', message: 'cursor must contain publishedAt and id' },
      ]);
    }

    return {
      publishedAt: parsed.publishedAt,
      id: parsed.id,
    };
  }
}

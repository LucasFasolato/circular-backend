import { Injectable } from '@nestjs/common';
import {
  decodeCursor,
  encodeCursor,
} from '../../../common/application/cursor-pagination';
import { withResponseMeta } from '../../../common/application/response-meta';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { LISTING_LIMITS } from '../../listings/domain/listing-limits.constants';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { SavedListingRepository } from '../../listings/infrastructure/saved-listing.repository';
import {
  DiscoveryFeedRepository,
  SavedListingsCursor,
} from '../infrastructure/discovery-feed.repository';
import { FeedDismissalRepository } from '../infrastructure/feed-dismissal.repository';
import {
  SavedListingsResponseDto,
  SaveListingStateResponseDto,
} from '../presentation/dto/discovery-feed.response.dto';
import { GetSavedListingsQueryDto } from '../presentation/dto/get-saved-listings-query.dto';
import { DiscoveryItemBuilder } from '../read-models/discovery-item.builder';
import { assertListingCanBeSaved } from './discovery-listing.policy';

@Injectable()
export class SavedListingsService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly savedListingRepository: SavedListingRepository,
    private readonly feedDismissalRepository: FeedDismissalRepository,
    private readonly discoveryFeedRepository: DiscoveryFeedRepository,
    private readonly discoveryItemBuilder: DiscoveryItemBuilder,
  ) {}

  async getMine(viewerUserId: string, query: GetSavedListingsQueryDto) {
    const limit = query.limit ?? LISTING_LIMITS.DEFAULT_LIST_LIMIT;
    const cursor = query.cursor
      ? this.decodeSavedCursor(query.cursor)
      : undefined;
    const listings = await this.discoveryFeedRepository.findSavedPage({
      viewerUserId,
      limit: limit + 1,
      cursor,
    });

    const hasMore = listings.length > limit;
    const pageItems = hasMore ? listings.slice(0, limit) : listings;
    const items = pageItems.map((item) =>
      this.discoveryItemBuilder.buildSavedItem(item),
    );
    const lastItem = pageItems.at(-1);

    return withResponseMeta<SavedListingsResponseDto>(
      {
        items,
      },
      {
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                savedAt: lastItem.savedAt,
                saveId: lastItem.saveId,
              })
            : null,
      },
    );
  }

  async save(
    viewerUserId: string,
    listingId: string,
  ): Promise<SaveListingStateResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw listingNotFoundError();
    }

    assertListingCanBeSaved(listing, viewerUserId);

    await this.savedListingRepository.createIfMissing(viewerUserId, listingId);

    return this.buildSaveStateResponse(viewerUserId, listingId, true);
  }

  async unsave(
    viewerUserId: string,
    listingId: string,
  ): Promise<SaveListingStateResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw listingNotFoundError();
    }

    await this.savedListingRepository.remove(viewerUserId, listingId);

    return this.buildSaveStateResponse(viewerUserId, listingId, false);
  }

  private async buildSaveStateResponse(
    viewerUserId: string,
    listingId: string,
    isSaved: boolean,
  ): Promise<SaveListingStateResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw listingNotFoundError();
    }

    const isDismissed = await this.feedDismissalRepository.exists(
      viewerUserId,
      listingId,
    );

    return this.discoveryItemBuilder.buildSaveStateResponse({
      listingId,
      state: listing.state as ListingState,
      allowsPurchase: listing.allowsPurchase,
      allowsTrade: listing.allowsTrade,
      isSaved,
      isDismissed,
      archivedAt: listing.archivedAt,
    });
  }

  private decodeSavedCursor(cursor: string): SavedListingsCursor {
    const parsed = decodeCursor<Partial<SavedListingsCursor>>(cursor);

    if (
      typeof parsed.savedAt !== 'string' ||
      parsed.savedAt.length === 0 ||
      typeof parsed.saveId !== 'string' ||
      parsed.saveId.length === 0
    ) {
      throw new ValidationAppError('Invalid cursor', [
        { field: 'cursor', message: 'cursor must contain savedAt and saveId' },
      ]);
    }

    return {
      savedAt: parsed.savedAt,
      saveId: parsed.saveId,
    };
  }
}

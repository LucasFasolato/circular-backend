import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { withResponseMeta } from '../../../common/application/response-meta';
import { ListingRepository } from '../infrastructure/listing.repository';
import { ListingAvailabilityReadRepository } from '../infrastructure/listing-availability-read.repository';
import { ListingAvailabilityPolicy } from './listing-availability.policy';
import { ListingSurfaceService } from './listing-surface.service';
import {
  ListingDetailResponseDto,
  MyListingsResponseDto,
} from '../presentation/dto/listing-response.dto';
import { ListMyListingsQueryDto } from '../presentation/dto/list-my-listings-query.dto';
import { ListingState } from '../domain/listing-state.enum';
import { LISTING_LIMITS } from '../domain/listing-limits.constants';

@Injectable()
export class ListingQueryService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly listingAvailabilityReadRepository: ListingAvailabilityReadRepository,
    private readonly listingSurfaceService: ListingSurfaceService,
  ) {}

  async getById(
    listingId: string,
    viewerUserId?: string,
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    const isOwner = viewerUserId === listing.ownerUserId;
    const availabilitySignals =
      await this.listingAvailabilityReadRepository.getSignals(
        listing.id,
        viewerUserId,
      );
    const isDiscoverable = ListingAvailabilityPolicy.isDiscoverable({
      ownerUserId: listing.ownerUserId,
      state: listing.state as ListingState,
      archivedAt: listing.archivedAt,
      reservationExpiresAt: listing.reservationExpiresAt,
      allowsPurchase: listing.allowsPurchase,
      allowsTrade: listing.allowsTrade,
      viewerUserId,
      hasActiveMatch: availabilitySignals.hasActiveMatch,
      isCommittedProposedItem: availabilitySignals.isCommittedProposedItem,
    });

    if (!isOwner && !isDiscoverable) {
      throw new NotFoundError('Listing not found');
    }

    return this.listingSurfaceService.buildDetail(listing, viewerUserId);
  }

  async getMine(ownerUserId: string, query: ListMyListingsQueryDto) {
    const limit = query.limit ?? LISTING_LIMITS.DEFAULT_LIST_LIMIT;
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;
    const listings = await this.listingRepository.findMyListings({
      ownerUserId,
      state: query.state,
      limit: limit + 1,
      cursor,
    });

    const hasMore = listings.length > limit;
    const pageItems = hasMore ? listings.slice(0, limit) : listings;
    const items = await this.listingSurfaceService.buildMany(
      pageItems,
      ownerUserId,
    );
    const lastItem = pageItems.at(-1);

    return withResponseMeta<MyListingsResponseDto>(
      {
        items,
      },
      {
        nextCursor:
          hasMore && lastItem
            ? this.encodeCursor(lastItem.updatedAt.toISOString(), lastItem.id)
            : null,
      },
    );
  }

  private encodeCursor(updatedAt: string, id: string): string {
    return Buffer.from(JSON.stringify({ updatedAt, id }), 'utf8').toString(
      'base64url',
    );
  }

  private decodeCursor(cursor: string): { updatedAt: string; id: string } {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { updatedAt?: string; id?: string };

    if (!parsed.updatedAt || !parsed.id) {
      throw new NotFoundError('Invalid cursor');
    }

    return {
      updatedAt: parsed.updatedAt,
      id: parsed.id,
    };
  }
}

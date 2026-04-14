import { Injectable } from '@nestjs/common';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingAvailabilityReadRepository } from '../../listings/infrastructure/listing-availability-read.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { FeedDismissalRepository } from '../infrastructure/feed-dismissal.repository';
import { DismissFeedItemResponseDto } from '../presentation/dto/dismiss-feed-item.response.dto';
import { assertListingCanBeDismissed } from './discovery-listing.policy';

@Injectable()
export class FeedDismissalService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly listingAvailabilityReadRepository: ListingAvailabilityReadRepository,
    private readonly feedDismissalRepository: FeedDismissalRepository,
  ) {}

  async dismiss(
    viewerUserId: string,
    listingId: string,
  ): Promise<DismissFeedItemResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw listingNotFoundError();
    }

    const availabilitySignals =
      await this.listingAvailabilityReadRepository.getSignals(
        listing.id,
        viewerUserId,
      );

    assertListingCanBeDismissed(listing, viewerUserId, {
      hasActiveMatch: availabilitySignals.hasActiveMatch,
      isCommittedProposedItem: availabilitySignals.isCommittedProposedItem,
    });

    await this.feedDismissalRepository.createIfMissing(viewerUserId, listingId);

    return {
      listingId,
      dismissed: true,
    };
  }
}

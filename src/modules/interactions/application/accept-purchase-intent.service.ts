import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import {
  listingAlreadyReservedError,
  listingNotFoundError,
} from '../../listings/domain/listing-errors';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { MatchBootstrapService } from '../../matches/application/match-bootstrap.service';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { InteractionType } from '../domain/interaction-type.enum';
import { interactionNotActiveError } from '../domain/interaction-errors';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { InteractionResolutionResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionConflictResolutionService } from './interaction-conflict-resolution.service';
import { InteractionResponseFactory } from './interaction-response.factory';
import { assertListingIsPublishedForInteractions } from './interaction-listing.policy';

@Injectable()
export class AcceptPurchaseIntentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly listingRepository: ListingRepository,
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
    private readonly interactionConflictResolutionService: InteractionConflictResolutionService,
    private readonly matchBootstrapService: MatchBootstrapService,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    ownerUserId: string,
    purchaseIntentId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseIntent =
        await this.purchaseIntentRepository.findByIdForUpdate(
          purchaseIntentId,
          manager,
        );

      if (!purchaseIntent) {
        throw new NotFoundError('Purchase intent not found');
      }

      if (purchaseIntent.listingOwnerUserId !== ownerUserId) {
        throw new ForbiddenError(
          'You can only accept purchase intents on your listings',
        );
      }

      const purchaseIntentState = purchaseIntent.state as PurchaseIntentState;
      if (purchaseIntentState !== PurchaseIntentState.ACTIVE) {
        throw interactionNotActiveError();
      }

      const listing = await this.listingRepository.findByIdForUpdate(
        purchaseIntent.listingId,
        manager,
      );

      if (!listing) {
        throw listingNotFoundError();
      }

      const targetHasCommitment =
        await this.proposedListingCommitmentRepository.hasActiveCommitments(
          [listing.id],
          manager,
        );

      assertListingIsPublishedForInteractions(listing, {
        hasActiveMatch: false,
        isCommittedProposedItem: targetHasCommitment,
      });

      const activeMatch =
        await this.matchSessionRepository.findActiveByListingId(
          listing.id,
          manager,
        );
      if (activeMatch) {
        throw listingAlreadyReservedError();
      }

      const match = await this.matchBootstrapService.createPurchaseMatch(
        {
          listingId: listing.id,
          purchaseIntentId: purchaseIntent.id,
          ownerUserId,
          buyerUserId: purchaseIntent.buyerUserId,
        },
        manager,
      );

      purchaseIntent.state = PurchaseIntentState.ACCEPTED;
      purchaseIntent.acceptedAt = new Date();
      purchaseIntent.resolvedByUserId = ownerUserId;
      await this.purchaseIntentRepository.save(purchaseIntent, manager);

      listing.state = ListingState.RESERVED;
      listing.reservationExpiresAt = match.expiresAt;
      await this.listingRepository.save(listing, manager);

      await this.interactionConflictResolutionService.expireCompetingInteractionsForListing(
        listing.id,
        purchaseIntent.id,
        'PURCHASE_INTENT',
        ownerUserId,
        manager,
      );

      return this.interactionResponseFactory.buildResolutionResponse({
        interactionType: InteractionType.PURCHASE_INTENT,
        interactionId: purchaseIntent.id,
        state: PurchaseIntentState.ACCEPTED,
        listingId: listing.id,
        listingState: ListingState.RESERVED,
        reservationExpiresAt: match.expiresAt,
        matchSessionId: match.matchSessionId,
        conversationThreadId: match.conversationThreadId,
      });
    });
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { INTERACTION_LIMITS } from '../domain/interaction-limits.constants';
import { purchaseIntentAlreadyExistsError } from '../domain/interaction-errors';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { CreatePurchaseIntentDto } from '../presentation/dto/create-purchase-intent.dto';
import { PurchaseIntentMutationResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';
import { assertListingCanReceiveInteraction } from './interaction-listing.policy';
import { isUniqueViolation } from './typeorm-error.util';

@Injectable()
export class CreatePurchaseIntentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly listingRepository: ListingRepository,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    buyerUserId: string,
    listingId: string,
    dto: CreatePurchaseIntentDto,
  ): Promise<PurchaseIntentMutationResponseDto> {
    const activeCount =
      await this.purchaseIntentRepository.countActiveByBuyerUserId(buyerUserId);
    if (
      activeCount >= INTERACTION_LIMITS.MAX_ACTIVE_PURCHASE_INTENTS_PER_USER
    ) {
      throw new ValidationAppError('Active purchase intent limit reached', [
        {
          field: 'purchaseIntent',
          message: `A user can have at most ${INTERACTION_LIMITS.MAX_ACTIVE_PURCHASE_INTENTS_PER_USER} active purchase intents`,
        },
      ]);
    }

    return this.dataSource.transaction(async (manager) => {
      const listing = await this.listingRepository.findByIdForUpdate(
        listingId,
        manager,
      );

      if (!listing) {
        throw listingNotFoundError();
      }

      const [hasActiveMatch, hasCommitments] = await Promise.all([
        this.matchSessionRepository.hasActiveByListingIds([listingId], manager),
        this.proposedListingCommitmentRepository.hasActiveCommitments(
          [listingId],
          manager,
        ),
      ]);

      assertListingCanReceiveInteraction(listing, buyerUserId, {
        hasActiveMatch,
        isCommittedProposedItem: hasCommitments,
      });

      try {
        const purchaseIntent = await this.purchaseIntentRepository.create(
          {
            listingId,
            buyerUserId,
            listingOwnerUserId: listing.ownerUserId,
            state: PurchaseIntentState.ACTIVE,
            source: dto.source ?? null,
            expiresAt: null,
            acceptedAt: null,
            rejectedAt: null,
            cancelledAt: null,
            closedAt: null,
            resolvedByUserId: null,
          },
          manager,
        );

        return this.interactionResponseFactory.buildPurchaseIntentMutation({
          id: purchaseIntent.id,
          state: PurchaseIntentState.ACTIVE,
          listingId: purchaseIntent.listingId,
          createdAt: purchaseIntent.createdAt,
          canCancel: true,
        });
      } catch (error) {
        if (
          isUniqueViolation(
            error,
            'uq_purchase_intents_active_listing_buyer',
          ) ||
          isUniqueViolation(
            error,
            'uq_purchase_intents_active_listing_buyer'.toLowerCase(),
          )
        ) {
          throw purchaseIntentAlreadyExistsError();
        }

        throw error;
      }
    });
  }
}

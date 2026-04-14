import { Injectable } from '@nestjs/common';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { INTERACTION_LIMITS } from '../domain/interaction-limits.constants';
import { purchaseIntentAlreadyExistsError } from '../domain/interaction-errors';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { CreatePurchaseIntentDto } from '../presentation/dto/create-purchase-intent.dto';
import { PurchaseIntentMutationResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';
import { assertListingCanReceiveInteraction } from './interaction-listing.policy';
import { isUniqueViolation } from './typeorm-error.util';

@Injectable()
export class CreatePurchaseIntentService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    buyerUserId: string,
    listingId: string,
    dto: CreatePurchaseIntentDto,
  ): Promise<PurchaseIntentMutationResponseDto> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw listingNotFoundError();
    }

    assertListingCanReceiveInteraction(listing, buyerUserId);

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

    try {
      const purchaseIntent = await this.purchaseIntentRepository.create({
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
      });

      return this.interactionResponseFactory.buildPurchaseIntentMutation({
        id: purchaseIntent.id,
        state: PurchaseIntentState.ACTIVE,
        listingId: purchaseIntent.listingId,
        createdAt: purchaseIntent.createdAt,
        canCancel: true,
      });
    } catch (error) {
      if (
        isUniqueViolation(error, 'uq_purchase_intents_active_listing_buyer') ||
        isUniqueViolation(
          error,
          'uq_purchase_intents_active_listing_buyer'.toLowerCase(),
        )
      ) {
        throw purchaseIntentAlreadyExistsError();
      }

      throw error;
    }
  }
}

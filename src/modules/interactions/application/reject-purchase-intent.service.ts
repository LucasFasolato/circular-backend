import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { InteractionType } from '../domain/interaction-type.enum';
import { interactionNotActiveError } from '../domain/interaction-errors';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { InteractionResolutionResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';

@Injectable()
export class RejectPurchaseIntentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly listingRepository: ListingRepository,
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
          'You can only reject purchase intents on your listings',
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
        throw new NotFoundError('Listing not found');
      }

      purchaseIntent.state = PurchaseIntentState.REJECTED;
      purchaseIntent.rejectedAt = new Date();
      purchaseIntent.resolvedByUserId = ownerUserId;
      await this.purchaseIntentRepository.save(purchaseIntent, manager);

      return this.interactionResponseFactory.buildResolutionResponse({
        interactionType: InteractionType.PURCHASE_INTENT,
        interactionId: purchaseIntent.id,
        state: PurchaseIntentState.REJECTED,
        listingId: listing.id,
        listingState: listing.state as never,
        reservationExpiresAt: listing.reservationExpiresAt,
      });
    });
  }
}

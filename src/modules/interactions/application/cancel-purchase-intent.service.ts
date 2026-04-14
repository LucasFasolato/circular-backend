import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { PurchaseIntentMutationResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';
import { interactionNotActiveError } from '../domain/interaction-errors';

@Injectable()
export class CancelPurchaseIntentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    buyerUserId: string,
    purchaseIntentId: string,
  ): Promise<PurchaseIntentMutationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseIntent =
        await this.purchaseIntentRepository.findByIdForUpdate(
          purchaseIntentId,
          manager,
        );

      if (!purchaseIntent) {
        throw new NotFoundError('Purchase intent not found');
      }

      if (purchaseIntent.buyerUserId !== buyerUserId) {
        throw new ForbiddenError(
          'You can only cancel your own purchase intents',
        );
      }

      const purchaseIntentState = purchaseIntent.state as PurchaseIntentState;
      if (purchaseIntentState !== PurchaseIntentState.ACTIVE) {
        throw interactionNotActiveError();
      }

      purchaseIntent.state = PurchaseIntentState.CANCELLED;
      purchaseIntent.cancelledAt = new Date();
      await this.purchaseIntentRepository.save(purchaseIntent, manager);

      return this.interactionResponseFactory.buildPurchaseIntentMutation({
        id: purchaseIntent.id,
        state: PurchaseIntentState.CANCELLED,
        listingId: purchaseIntent.listingId,
        createdAt: purchaseIntent.createdAt,
        canCancel: false,
      });
    });
  }
}

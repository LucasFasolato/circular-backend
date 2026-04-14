import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';

@Injectable()
export class InteractionConflictResolutionService {
  constructor(
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly tradeProposalRepository: TradeProposalRepository,
  ) {}

  async expireCompetingInteractionsForListing(
    listingId: string,
    acceptedInteractionId: string,
    acceptedInteractionType: 'PURCHASE_INTENT' | 'TRADE_PROPOSAL',
    resolvedByUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.purchaseIntentRepository.expireActiveByListingExcept(
      listingId,
      acceptedInteractionType === 'PURCHASE_INTENT'
        ? acceptedInteractionId
        : null,
      resolvedByUserId,
      manager,
    );

    await this.tradeProposalRepository.expireActiveByTargetListingExcept(
      listingId,
      acceptedInteractionType === 'TRADE_PROPOSAL'
        ? acceptedInteractionId
        : null,
      resolvedByUserId,
      manager,
    );
  }

  async expireTradeProposalsUsingUnavailableProposedItems(
    proposedListingIds: string[],
    acceptedTradeProposalId: string,
    resolvedByUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    await this.tradeProposalRepository.expireActiveByProposedListingIdsExcept(
      proposedListingIds,
      acceptedTradeProposalId,
      resolvedByUserId,
      manager,
    );
  }
}

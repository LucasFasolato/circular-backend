import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { InteractionType } from '../domain/interaction-type.enum';
import { interactionNotActiveError } from '../domain/interaction-errors';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { InteractionResolutionResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';

@Injectable()
export class RejectTradeProposalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly listingRepository: ListingRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    ownerUserId: string,
    tradeProposalId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const tradeProposal =
        await this.tradeProposalRepository.findByIdForUpdate(
          tradeProposalId,
          manager,
        );

      if (!tradeProposal) {
        throw new NotFoundError('Trade proposal not found');
      }

      if (tradeProposal.targetListingOwnerUserId !== ownerUserId) {
        throw new ForbiddenError(
          'You can only reject trade proposals on your listings',
        );
      }

      const tradeProposalState = tradeProposal.state as TradeProposalState;
      if (tradeProposalState !== TradeProposalState.ACTIVE) {
        throw interactionNotActiveError();
      }

      const listing = await this.listingRepository.findByIdForUpdate(
        tradeProposal.targetListingId,
        manager,
      );

      if (!listing) {
        throw new NotFoundError('Listing not found');
      }

      tradeProposal.state = TradeProposalState.REJECTED;
      tradeProposal.rejectedAt = new Date();
      tradeProposal.resolvedByUserId = ownerUserId;
      await this.tradeProposalRepository.save(tradeProposal, manager);

      return this.interactionResponseFactory.buildResolutionResponse({
        interactionType: InteractionType.TRADE_PROPOSAL,
        interactionId: tradeProposal.id,
        state: TradeProposalState.REJECTED,
        listingId: listing.id,
        listingState: listing.state as never,
        reservationExpiresAt: listing.reservationExpiresAt,
      });
    });
  }
}

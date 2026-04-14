import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { interactionNotActiveError } from '../domain/interaction-errors';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { TradeProposalMutationResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';

@Injectable()
export class CancelTradeProposalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly tradeProposalItemRepository: TradeProposalItemRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    proposerUserId: string,
    tradeProposalId: string,
  ): Promise<TradeProposalMutationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const tradeProposal =
        await this.tradeProposalRepository.findByIdForUpdate(
          tradeProposalId,
          manager,
        );

      if (!tradeProposal) {
        throw new NotFoundError('Trade proposal not found');
      }

      if (tradeProposal.proposerUserId !== proposerUserId) {
        throw new ForbiddenError(
          'You can only cancel your own trade proposals',
        );
      }

      const tradeProposalState = tradeProposal.state as TradeProposalState;
      if (tradeProposalState !== TradeProposalState.ACTIVE) {
        throw interactionNotActiveError();
      }

      tradeProposal.state = TradeProposalState.CANCELLED;
      tradeProposal.cancelledAt = new Date();
      await this.tradeProposalRepository.save(tradeProposal, manager);

      const items =
        await this.tradeProposalItemRepository.findByTradeProposalId(
          tradeProposal.id,
          manager,
        );

      return this.interactionResponseFactory.buildTradeProposalMutation({
        id: tradeProposal.id,
        state: TradeProposalState.CANCELLED,
        listingId: tradeProposal.targetListingId,
        proposedListingIds: items.map((item) => item.proposedListingId),
        createdAt: tradeProposal.createdAt,
        canCancel: false,
      });
    });
  }
}

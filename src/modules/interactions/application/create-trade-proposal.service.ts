import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { INTERACTION_LIMITS } from '../domain/interaction-limits.constants';
import {
  proposedItemAlreadyCommittedError,
  tradeProposalAlreadyExistsError,
} from '../domain/interaction-errors';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { CreateTradeProposalDto } from '../presentation/dto/create-trade-proposal.dto';
import { TradeProposalMutationResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionResponseFactory } from './interaction-response.factory';
import {
  assertListingCanReceiveInteraction,
  assertProposedListingIsAvailable,
} from './interaction-listing.policy';
import { isUniqueViolation } from './typeorm-error.util';

@Injectable()
export class CreateTradeProposalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly listingRepository: ListingRepository,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly tradeProposalItemRepository: TradeProposalItemRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
  ) {}

  async execute(
    proposerUserId: string,
    targetListingId: string,
    dto: CreateTradeProposalDto,
  ): Promise<TradeProposalMutationResponseDto> {
    const targetListing =
      await this.listingRepository.findById(targetListingId);

    if (!targetListing) {
      throw listingNotFoundError();
    }

    assertListingCanReceiveInteraction(targetListing, proposerUserId);

    const activeCount =
      await this.tradeProposalRepository.countActiveByProposerUserId(
        proposerUserId,
      );
    if (activeCount >= INTERACTION_LIMITS.MAX_ACTIVE_TRADE_PROPOSALS_PER_USER) {
      throw new ValidationAppError('Active trade proposal limit reached', [
        {
          field: 'tradeProposal',
          message: `A user can have at most ${INTERACTION_LIMITS.MAX_ACTIVE_TRADE_PROPOSALS_PER_USER} active trade proposals`,
        },
      ]);
    }

    return this.dataSource.transaction(async (manager) => {
      const proposedListings = await this.listingRepository.findManyByIds(
        dto.proposedListingIds,
        manager,
      );

      if (proposedListings.length !== dto.proposedListingIds.length) {
        throw listingNotFoundError();
      }

      proposedListings.forEach((listing) =>
        assertProposedListingIsAvailable(listing, proposerUserId),
      );

      const hasCommitments =
        await this.proposedListingCommitmentRepository.hasActiveCommitments(
          dto.proposedListingIds,
          manager,
        );
      if (hasCommitments) {
        throw proposedItemAlreadyCommittedError();
      }

      try {
        const tradeProposal = await this.tradeProposalRepository.create(
          {
            targetListingId,
            proposerUserId,
            targetListingOwnerUserId: targetListing.ownerUserId,
            state: TradeProposalState.ACTIVE,
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

        await this.tradeProposalItemRepository.createMany(
          dto.proposedListingIds.map((proposedListingId) => ({
            tradeProposalId: tradeProposal.id,
            proposedListingId,
          })),
          manager,
        );

        return this.interactionResponseFactory.buildTradeProposalMutation({
          id: tradeProposal.id,
          state: TradeProposalState.ACTIVE,
          listingId: targetListingId,
          proposedListingIds: dto.proposedListingIds,
          createdAt: tradeProposal.createdAt,
          canCancel: true,
        });
      } catch (error) {
        if (
          isUniqueViolation(
            error,
            'uq_trade_proposals_active_target_listing_proposer',
          )
        ) {
          throw tradeProposalAlreadyExistsError();
        }

        throw error;
      }
    });
  }
}

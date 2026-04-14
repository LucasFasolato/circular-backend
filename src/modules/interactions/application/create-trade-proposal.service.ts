import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { MatchSessionRepository } from '../../matches/infrastructure/match-session.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
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
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly interactionResponseFactory: InteractionResponseFactory,
    private readonly notificationCommandService: NotificationCommandService,
  ) {}

  async execute(
    proposerUserId: string,
    targetListingId: string,
    dto: CreateTradeProposalDto,
  ): Promise<TradeProposalMutationResponseDto> {
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
      const targetListing = await this.listingRepository.findByIdForUpdate(
        targetListingId,
        manager,
      );

      if (!targetListing) {
        throw listingNotFoundError();
      }

      const [targetHasActiveMatch, targetHasCommitment] = await Promise.all([
        this.matchSessionRepository.hasActiveByListingIds(
          [targetListingId],
          manager,
        ),
        this.proposedListingCommitmentRepository.hasActiveCommitments(
          [targetListingId],
          manager,
        ),
      ]);

      assertListingCanReceiveInteraction(targetListing, proposerUserId, {
        hasActiveMatch: targetHasActiveMatch,
        isCommittedProposedItem: targetHasCommitment,
      });

      const proposedListings =
        await this.listingRepository.findManyByIdsForUpdate(
          dto.proposedListingIds,
          manager,
        );

      if (proposedListings.length !== dto.proposedListingIds.length) {
        throw listingNotFoundError();
      }

      const [proposedHasActiveMatch, proposedHasCommitments] =
        await Promise.all([
          this.matchSessionRepository.hasActiveByListingIds(
            dto.proposedListingIds,
            manager,
          ),
          this.proposedListingCommitmentRepository.hasActiveCommitments(
            dto.proposedListingIds,
            manager,
          ),
        ]);

      if (proposedHasCommitments) {
        throw proposedItemAlreadyCommittedError();
      }

      proposedListings.forEach((listing) =>
        assertProposedListingIsAvailable(listing, proposerUserId, {
          hasActiveMatch: proposedHasActiveMatch,
          isCommittedProposedItem: proposedHasCommitments,
        }),
      );

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

        await this.notificationCommandService.notifyTradeProposalReceived(
          {
            userId: targetListing.ownerUserId,
            listingId: targetListingId,
            tradeProposalId: tradeProposal.id,
            proposerUserId,
            proposedListingIds: dto.proposedListingIds,
          },
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

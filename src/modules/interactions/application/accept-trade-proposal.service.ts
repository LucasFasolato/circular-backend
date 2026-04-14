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
import { InteractionType } from '../domain/interaction-type.enum';
import {
  interactionNotActiveError,
  proposedItemAlreadyCommittedError,
} from '../domain/interaction-errors';
import { ProposedListingCommitmentState } from '../domain/proposed-listing-commitment-state.enum';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';
import { ProposedListingCommitmentRepository } from '../infrastructure/proposed-listing-commitment.repository';
import { TradeProposalItemRepository } from '../infrastructure/trade-proposal-item.repository';
import { TradeProposalRepository } from '../infrastructure/trade-proposal.repository';
import { InteractionResolutionResponseDto } from '../presentation/dto/interaction-response.dto';
import { InteractionConflictResolutionService } from './interaction-conflict-resolution.service';
import { InteractionResponseFactory } from './interaction-response.factory';
import {
  assertListingIsPublishedForInteractions,
  assertProposedListingIsAvailable,
} from './interaction-listing.policy';
import { MatchBootstrapService } from './match-bootstrap.service';

@Injectable()
export class AcceptTradeProposalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly tradeProposalItemRepository: TradeProposalItemRepository,
    private readonly listingRepository: ListingRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly interactionConflictResolutionService: InteractionConflictResolutionService,
    private readonly matchBootstrapService: MatchBootstrapService,
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
          'You can only accept trade proposals on your listings',
        );
      }

      const tradeProposalState = tradeProposal.state as TradeProposalState;
      if (tradeProposalState !== TradeProposalState.ACTIVE) {
        throw interactionNotActiveError();
      }

      const targetListing = await this.listingRepository.findByIdForUpdate(
        tradeProposal.targetListingId,
        manager,
      );

      if (!targetListing) {
        throw listingNotFoundError();
      }

      assertListingIsPublishedForInteractions(targetListing);

      const activeMatch =
        await this.matchSessionRepository.findActiveByListingId(
          targetListing.id,
          manager,
        );
      if (activeMatch) {
        throw listingAlreadyReservedError();
      }

      const items =
        await this.tradeProposalItemRepository.findByTradeProposalId(
          tradeProposal.id,
          manager,
        );
      const proposedListingIds = items.map((item) => item.proposedListingId);
      const proposedListings =
        await this.listingRepository.findManyByIdsForUpdate(
          proposedListingIds,
          manager,
        );

      if (proposedListings.length !== proposedListingIds.length) {
        throw listingNotFoundError();
      }

      proposedListings.forEach((listing) =>
        assertProposedListingIsAvailable(listing, tradeProposal.proposerUserId),
      );

      const hasCommitments =
        await this.proposedListingCommitmentRepository.hasActiveCommitments(
          proposedListingIds,
          manager,
        );
      if (hasCommitments) {
        throw proposedItemAlreadyCommittedError();
      }

      const match = await this.matchBootstrapService.createTradeMatch(
        {
          listingId: targetListing.id,
          tradeProposalId: tradeProposal.id,
          ownerUserId,
          proposerUserId: tradeProposal.proposerUserId,
        },
        manager,
      );

      tradeProposal.state = TradeProposalState.ACCEPTED;
      tradeProposal.acceptedAt = new Date();
      tradeProposal.resolvedByUserId = ownerUserId;
      await this.tradeProposalRepository.save(tradeProposal, manager);

      targetListing.state = ListingState.RESERVED;
      targetListing.reservationExpiresAt = match.expiresAt;
      await this.listingRepository.save(targetListing, manager);

      await this.proposedListingCommitmentRepository.createMany(
        proposedListingIds.map((proposedListingId) => ({
          proposedListingId,
          tradeProposalId: tradeProposal.id,
          matchSessionId: match.matchSessionId,
          state: ProposedListingCommitmentState.COMMITTED_TO_MATCH,
          releasedAt: null,
        })),
        manager,
      );

      await this.interactionConflictResolutionService.expireCompetingInteractionsForListing(
        targetListing.id,
        tradeProposal.id,
        'TRADE_PROPOSAL',
        ownerUserId,
        manager,
      );
      await this.interactionConflictResolutionService.expireTradeProposalsUsingUnavailableProposedItems(
        [...proposedListingIds, targetListing.id],
        tradeProposal.id,
        ownerUserId,
        manager,
      );

      return this.interactionResponseFactory.buildResolutionResponse({
        interactionType: InteractionType.TRADE_PROPOSAL,
        interactionId: tradeProposal.id,
        state: TradeProposalState.ACCEPTED,
        listingId: targetListing.id,
        listingState: ListingState.RESERVED,
        reservationExpiresAt: match.expiresAt,
        matchSessionId: match.matchSessionId,
        conversationThreadId: match.conversationThreadId,
      });
    });
  }
}

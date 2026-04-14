import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ProposedListingCommitmentRepository } from '../../interactions/infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../../interactions/infrastructure/purchase-intent.repository';
import { TradeProposalRepository } from '../../interactions/infrastructure/trade-proposal.repository';
import { PurchaseIntentState } from '../../interactions/domain/purchase-intent-state.enum';
import { TradeProposalState } from '../../interactions/domain/trade-proposal-state.enum';
import { ConversationThreadEntity } from '../domain/conversation-thread.entity';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import {
  deriveListingStateAfterMatchExpiration,
  shouldExpireMatch,
} from '../domain/match-expiration.policy';
import { MatchSessionEntity } from '../domain/match-session.entity';
import { MatchSessionState } from '../domain/match-session-state.enum';
import {
  canConversationTransition,
  canMatchTransition,
} from '../domain/match-state.policy';
import { ConversationThreadRepository } from '../infrastructure/conversation-thread.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';

export interface MatchExpirationRunResult {
  processedCount: number;
  expiredCount: number;
  skippedCount: number;
  errorsCount: number;
}

interface ExpireLockedMatchInput {
  match: MatchSessionEntity;
  listing: ListingEntity;
  conversation: ConversationThreadEntity | null;
  manager: EntityManager;
  now: Date;
}

@Injectable()
export class MatchExpirationService {
  private readonly logger = new Logger(MatchExpirationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly conversationThreadRepository: ConversationThreadRepository,
    private readonly listingRepository: ListingRepository,
    private readonly notificationCommandService: NotificationCommandService,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
  ) {}

  async expireDueMatches(params?: {
    now?: Date;
    batchSize?: number;
  }): Promise<MatchExpirationRunResult> {
    const now = params?.now ?? new Date();
    const expiredMatchIds =
      await this.matchSessionRepository.findExpiredActiveIds(
        now,
        params?.batchSize,
      );
    const result: MatchExpirationRunResult = {
      processedCount: expiredMatchIds.length,
      expiredCount: 0,
      skippedCount: 0,
      errorsCount: 0,
    };

    for (const matchSessionId of expiredMatchIds) {
      try {
        const outcome = await this.dataSource.transaction(async (manager) => {
          const match = await this.matchSessionRepository.findByIdForUpdate(
            matchSessionId,
            manager,
          );

          if (!match) {
            return 'skipped' as const;
          }

          const listing = await this.listingRepository.findByIdForUpdate(
            match.listingId,
            manager,
          );

          if (!listing) {
            throw listingNotFoundError();
          }

          const conversation =
            await this.conversationThreadRepository.findByMatchSessionIdForUpdate(
              match.id,
              manager,
            );

          await this.proposedListingCommitmentRepository.findActiveByMatchSessionIdForUpdate(
            match.id,
            manager,
          );

          const expired = await this.expireLockedMatchIfDue({
            match,
            listing,
            conversation,
            manager,
            now,
          });

          return expired ? ('expired' as const) : ('skipped' as const);
        });

        if (outcome === 'expired') {
          result.expiredCount += 1;
        } else {
          result.skippedCount += 1;
        }
      } catch (error) {
        result.errorsCount += 1;
        this.logger.error(
          `Operational match expiration failed for match ${matchSessionId}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'matches.expiration.batch_processed',
        ...result,
        evaluatedAt: now.toISOString(),
      }),
    );

    return result;
  }

  async expireLockedMatchIfDue({
    match,
    listing,
    conversation,
    manager,
    now,
  }: ExpireLockedMatchInput): Promise<boolean> {
    if (!shouldExpireMatch(match, now)) {
      return false;
    }

    const currentState = match.state as MatchSessionState;
    if (!canMatchTransition(currentState, MatchSessionState.EXPIRED)) {
      return false;
    }

    match.state = MatchSessionState.EXPIRED;
    match.failedAt = null;
    match.cancelledAt = null;
    match.completedAt = null;
    match.closedAt = null;
    match.successConfirmedByOwnerAt = null;
    match.successConfirmedByCounterpartyAt = null;

    listing.state = deriveListingStateAfterMatchExpiration(
      listing.state as ListingState,
    );
    listing.reservationExpiresAt = null;

    if (
      conversation &&
      canConversationTransition(
        conversation.state as ConversationThreadState,
        ConversationThreadState.CLOSED,
      )
    ) {
      conversation.state = ConversationThreadState.CLOSED;
      conversation.closedAt = now;
      await this.conversationThreadRepository.save(conversation, manager);
    } else if (
      conversation &&
      (conversation.state as ConversationThreadState) ===
        ConversationThreadState.CLOSED &&
      !conversation.closedAt
    ) {
      conversation.closedAt = now;
      await this.conversationThreadRepository.save(conversation, manager);
    }

    await this.closeOriginInteraction(match, manager, now);
    await this.proposedListingCommitmentRepository.releaseByMatchSessionId(
      match.id,
      manager,
    );
    await this.notificationCommandService.notifyReservationExpired(
      {
        userId: match.ownerUserId,
        listingId: listing.id,
        matchSessionId: match.id,
        expiredAt: now,
      },
      manager,
    );
    await this.notificationCommandService.notifyReservationExpired(
      {
        userId: match.counterpartyUserId,
        listingId: listing.id,
        matchSessionId: match.id,
        expiredAt: now,
      },
      manager,
    );
    await this.listingRepository.save(listing, manager);
    await this.matchSessionRepository.save(match, manager);

    this.logger.log(
      JSON.stringify({
        event: 'matches.expiration.applied',
        matchSessionId: match.id,
        listingId: listing.id,
        conversationId: conversation?.id ?? null,
        resultingMatchState: match.state,
        resultingListingState: listing.state,
        evaluatedAt: now.toISOString(),
      }),
    );

    return true;
  }

  private async closeOriginInteraction(
    match: {
      id: string;
      originPurchaseIntentId?: string | null;
      originTradeProposalId?: string | null;
    },
    manager: EntityManager,
    closedAt: Date,
  ): Promise<void> {
    if (match.originPurchaseIntentId) {
      const purchaseIntent = await this.purchaseIntentRepository.findById(
        match.originPurchaseIntentId,
        manager,
      );

      if (purchaseIntent) {
        purchaseIntent.state = PurchaseIntentState.CLOSED;
        purchaseIntent.closedAt = closedAt;
        await this.purchaseIntentRepository.save(purchaseIntent, manager);
      }
    }

    if (match.originTradeProposalId) {
      const tradeProposal = await this.tradeProposalRepository.findById(
        match.originTradeProposalId,
        manager,
      );

      if (tradeProposal) {
        tradeProposal.state = TradeProposalState.CLOSED;
        tradeProposal.closedAt = closedAt;
        await this.tradeProposalRepository.save(tradeProposal, manager);
      }
    }
  }
}

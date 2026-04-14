import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import { MatchType } from '../domain/match-type.enum';
import { MatchSessionState } from '../domain/match-session-state.enum';
import { MATCH_LIMITS } from '../domain/match-limits.constants';
import { ConversationThreadRepository } from '../infrastructure/conversation-thread.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';

@Injectable()
export class MatchBootstrapService {
  constructor(
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly conversationThreadRepository: ConversationThreadRepository,
  ) {}

  async createPurchaseMatch(
    input: {
      listingId: string;
      purchaseIntentId: string;
      ownerUserId: string;
      buyerUserId: string;
    },
    manager: EntityManager,
  ): Promise<{
    matchSessionId: string;
    conversationThreadId: string;
    expiresAt: Date;
  }> {
    return this.createMatch(
      {
        type: MatchType.PURCHASE,
        listingId: input.listingId,
        originPurchaseIntentId: input.purchaseIntentId,
        originTradeProposalId: null,
        ownerUserId: input.ownerUserId,
        counterpartyUserId: input.buyerUserId,
      },
      manager,
    );
  }

  async createTradeMatch(
    input: {
      listingId: string;
      tradeProposalId: string;
      ownerUserId: string;
      proposerUserId: string;
    },
    manager: EntityManager,
  ): Promise<{
    matchSessionId: string;
    conversationThreadId: string;
    expiresAt: Date;
  }> {
    return this.createMatch(
      {
        type: MatchType.TRADE,
        listingId: input.listingId,
        originPurchaseIntentId: null,
        originTradeProposalId: input.tradeProposalId,
        ownerUserId: input.ownerUserId,
        counterpartyUserId: input.proposerUserId,
      },
      manager,
    );
  }

  private async createMatch(
    input: {
      type: MatchType;
      listingId: string;
      originPurchaseIntentId: string | null;
      originTradeProposalId: string | null;
      ownerUserId: string;
      counterpartyUserId: string;
    },
    manager: EntityManager,
  ): Promise<{
    matchSessionId: string;
    conversationThreadId: string;
    expiresAt: Date;
  }> {
    const expiresAt = new Date(
      Date.now() + MATCH_LIMITS.RESERVATION_DURATION_HOURS * 60 * 60 * 1000,
    );
    const matchSession = await this.matchSessionRepository.create(
      {
        type: input.type,
        state: MatchSessionState.OPEN,
        listingId: input.listingId,
        originPurchaseIntentId: input.originPurchaseIntentId,
        originTradeProposalId: input.originTradeProposalId,
        ownerUserId: input.ownerUserId,
        counterpartyUserId: input.counterpartyUserId,
        expiresAt,
        completedAt: null,
        failedAt: null,
        cancelledAt: null,
        closedAt: null,
        successConfirmedByOwnerAt: null,
        successConfirmedByCounterpartyAt: null,
      },
      manager,
    );
    const thread = await this.conversationThreadRepository.create(
      {
        matchSessionId: matchSession.id,
        state: ConversationThreadState.OPEN,
        restrictedAt: null,
        closedAt: null,
        archivedAt: null,
      },
      manager,
    );

    return {
      matchSessionId: matchSession.id,
      conversationThreadId: thread.id,
      expiresAt,
    };
  }
}

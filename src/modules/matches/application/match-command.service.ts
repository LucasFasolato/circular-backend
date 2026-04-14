import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { listingNotFoundError } from '../../listings/domain/listing-errors';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ProposedListingCommitmentRepository } from '../../interactions/infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from '../../interactions/infrastructure/purchase-intent.repository';
import { TradeProposalRepository } from '../../interactions/infrastructure/trade-proposal.repository';
import { PurchaseIntentState } from '../../interactions/domain/purchase-intent-state.enum';
import { TradeProposalState } from '../../interactions/domain/trade-proposal-state.enum';
import {
  conversationClosedError,
  conversationNotFoundError,
  matchAlreadyClosedError,
  matchNotConfirmableError,
  matchNotFoundError,
} from '../domain/match-errors';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import { MatchSessionState } from '../domain/match-session-state.enum';
import {
  canConversationTransition,
  canMatchTransition,
  isMatchActive,
} from '../domain/match-state.policy';
import { MessageType } from '../domain/message-type.enum';
import { QuickActionCode } from '../domain/quick-action-code.enum';
import { ConversationMessageRepository } from '../infrastructure/conversation-message.repository';
import { ConversationThreadRepository } from '../infrastructure/conversation-thread.repository';
import { MatchReadRepository } from '../infrastructure/match-read.repository';
import { MatchSessionRepository } from '../infrastructure/match-session.repository';
import { MatchExpirationService } from './match-expiration.service';
import { ConversationMessageMutationResponseDto } from '../presentation/dto/conversation-response.dto';
import { MatchMutationResponseDto } from '../presentation/dto/match-response.dto';
import { MatchSurfaceBuilder } from '../read-models/match-surface.builder';

@Injectable()
export class MatchCommandService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly matchSessionRepository: MatchSessionRepository,
    private readonly conversationThreadRepository: ConversationThreadRepository,
    private readonly conversationMessageRepository: ConversationMessageRepository,
    private readonly matchReadRepository: MatchReadRepository,
    private readonly matchSurfaceBuilder: MatchSurfaceBuilder,
    private readonly listingRepository: ListingRepository,
    private readonly notificationCommandService: NotificationCommandService,
    private readonly purchaseIntentRepository: PurchaseIntentRepository,
    private readonly tradeProposalRepository: TradeProposalRepository,
    private readonly proposedListingCommitmentRepository: ProposedListingCommitmentRepository,
    private readonly matchExpirationService: MatchExpirationService,
  ) {}

  async confirmSuccess(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const match = await this.getMatchForUpdate(matchSessionId, manager);
      const listing = await this.getListingForUpdate(match.listingId, manager);
      const conversation = await this.getConversationForUpdate(
        match.id,
        manager,
      );

      this.assertParticipant(
        match.ownerUserId,
        match.counterpartyUserId,
        viewerUserId,
      );
      await this.matchExpirationService.expireLockedMatchIfDue({
        match,
        listing,
        conversation,
        manager,
        now: new Date(),
      });

      const state = match.state as MatchSessionState;
      if (!isMatchActive(state)) {
        throw matchNotConfirmableError();
      }

      const now = new Date();
      if (match.ownerUserId === viewerUserId) {
        match.successConfirmedByOwnerAt ??= now;
      } else {
        match.successConfirmedByCounterpartyAt ??= now;
      }

      if (
        match.successConfirmedByOwnerAt !== null &&
        match.successConfirmedByCounterpartyAt !== null
      ) {
        if (!canMatchTransition(state, MatchSessionState.COMPLETED)) {
          throw matchNotConfirmableError();
        }

        match.state = MatchSessionState.COMPLETED;
        match.completedAt = now;
        listing.state = ListingState.CLOSED;
        listing.closedAt = now;
        listing.reservationExpiresAt = null;

        if (
          canConversationTransition(
            conversation.state as ConversationThreadState,
            ConversationThreadState.RESTRICTED,
          )
        ) {
          conversation.state = ConversationThreadState.RESTRICTED;
          conversation.restrictedAt = now;
        }

        await this.closeOriginInteraction(match, manager, now);
        await this.proposedListingCommitmentRepository.releaseByMatchSessionId(
          match.id,
          manager,
        );
        await this.notificationCommandService.notifyMatchCompletedMany(
          [
            {
              userId: match.ownerUserId,
              listingId: listing.id,
              matchSessionId: match.id,
              completedAt: now,
            },
            {
              userId: match.counterpartyUserId,
              listingId: listing.id,
              matchSessionId: match.id,
              completedAt: now,
            },
          ],
          manager,
        );
        await this.listingRepository.save(listing, manager);
        await this.conversationThreadRepository.save(conversation, manager);
      }

      await this.matchSessionRepository.save(match, manager);
    });

    return this.getMutationSurface(viewerUserId, matchSessionId);
  }

  async markFailed(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    await this.transitionMatchToFailureState(
      viewerUserId,
      matchSessionId,
      MatchSessionState.FAILED,
    );
    return this.getMutationSurface(viewerUserId, matchSessionId);
  }

  async cancel(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    await this.transitionMatchToFailureState(
      viewerUserId,
      matchSessionId,
      MatchSessionState.CANCELLED,
    );
    return this.getMutationSurface(viewerUserId, matchSessionId);
  }

  async sendMessage(
    viewerUserId: string,
    conversationId: string,
    text: string,
  ): Promise<ConversationMessageMutationResponseDto> {
    const messageId = await this.dataSource.transaction(async (manager) => {
      const conversation = await this.getConversationByIdForUpdate(
        conversationId,
        manager,
      );
      const match = await this.getMatchForUpdate(
        conversation.matchSessionId,
        manager,
      );
      const listing = await this.getListingForUpdate(match.listingId, manager);

      this.assertParticipant(
        match.ownerUserId,
        match.counterpartyUserId,
        viewerUserId,
      );
      await this.matchExpirationService.expireLockedMatchIfDue({
        match,
        listing,
        conversation,
        manager,
        now: new Date(),
      });
      this.assertConversationOpen(
        conversation.state as ConversationThreadState,
      );

      const matchState = match.state as MatchSessionState;
      if (!isMatchActive(matchState)) {
        throw matchAlreadyClosedError();
      }

      if (matchState === MatchSessionState.OPEN) {
        match.state = MatchSessionState.ACTIVE;
        await this.matchSessionRepository.save(match, manager);
      }

      const message = await this.conversationMessageRepository.create(
        {
          conversationThreadId: conversation.id,
          senderUserId: viewerUserId,
          messageType: MessageType.TEXT,
          textBody: text,
          quickActionCode: null,
          metadata: {},
        },
        manager,
      );

      await this.notificationCommandService.notifyNewConversationMessage(
        {
          userId:
            viewerUserId === match.ownerUserId
              ? match.counterpartyUserId
              : match.ownerUserId,
          matchSessionId: match.id,
          conversationThreadId: conversation.id,
          messageId: message.id,
          senderUserId: viewerUserId,
          messageType: MessageType.TEXT,
        },
        manager,
      );

      return message.id;
    });

    return this.getConversationMutationSurface(
      viewerUserId,
      conversationId,
      messageId,
    );
  }

  async useQuickAction(
    viewerUserId: string,
    conversationId: string,
    action: QuickActionCode,
  ): Promise<ConversationMessageMutationResponseDto> {
    const messageId = await this.dataSource.transaction(async (manager) => {
      const conversation = await this.getConversationByIdForUpdate(
        conversationId,
        manager,
      );
      const match = await this.getMatchForUpdate(
        conversation.matchSessionId,
        manager,
      );
      const listing = await this.getListingForUpdate(match.listingId, manager);

      this.assertParticipant(
        match.ownerUserId,
        match.counterpartyUserId,
        viewerUserId,
      );
      await this.matchExpirationService.expireLockedMatchIfDue({
        match,
        listing,
        conversation,
        manager,
        now: new Date(),
      });
      this.assertConversationOpen(
        conversation.state as ConversationThreadState,
      );

      const matchState = match.state as MatchSessionState;
      if (!isMatchActive(matchState)) {
        throw matchAlreadyClosedError();
      }

      if (matchState === MatchSessionState.OPEN) {
        match.state = MatchSessionState.ACTIVE;
        await this.matchSessionRepository.save(match, manager);
      }

      const message = await this.conversationMessageRepository.create(
        {
          conversationThreadId: conversation.id,
          senderUserId: viewerUserId,
          messageType: MessageType.QUICK_ACTION,
          textBody: null,
          quickActionCode: action,
          metadata: {},
        },
        manager,
      );

      await this.notificationCommandService.notifyNewConversationMessage(
        {
          userId:
            viewerUserId === match.ownerUserId
              ? match.counterpartyUserId
              : match.ownerUserId,
          matchSessionId: match.id,
          conversationThreadId: conversation.id,
          messageId: message.id,
          senderUserId: viewerUserId,
          messageType: MessageType.QUICK_ACTION,
        },
        manager,
      );

      return message.id;
    });

    return this.getConversationMutationSurface(
      viewerUserId,
      conversationId,
      messageId,
    );
  }

  async expireDueMatches(): Promise<number> {
    const result = await this.matchExpirationService.expireDueMatches();
    return result.expiredCount;
  }

  private async transitionMatchToFailureState(
    viewerUserId: string,
    matchSessionId: string,
    terminalState: MatchSessionState.FAILED | MatchSessionState.CANCELLED,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const match = await this.getMatchForUpdate(matchSessionId, manager);
      const listing = await this.getListingForUpdate(match.listingId, manager);
      const conversation = await this.getConversationForUpdate(
        match.id,
        manager,
      );

      this.assertParticipant(
        match.ownerUserId,
        match.counterpartyUserId,
        viewerUserId,
      );
      await this.matchExpirationService.expireLockedMatchIfDue({
        match,
        listing,
        conversation,
        manager,
        now: new Date(),
      });

      const state = match.state as MatchSessionState;
      if (!isMatchActive(state) || !canMatchTransition(state, terminalState)) {
        throw matchAlreadyClosedError();
      }

      const now = new Date();
      match.state = terminalState;
      match.failedAt = terminalState === MatchSessionState.FAILED ? now : null;
      match.cancelledAt =
        terminalState === MatchSessionState.CANCELLED ? now : null;

      listing.state = ListingState.PUBLISHED;
      listing.reservationExpiresAt = null;

      if (
        canConversationTransition(
          conversation.state as ConversationThreadState,
          ConversationThreadState.CLOSED,
        )
      ) {
        conversation.state = ConversationThreadState.CLOSED;
        conversation.closedAt = now;
      }

      await this.closeOriginInteraction(match, manager, now);
      await this.proposedListingCommitmentRepository.releaseByMatchSessionId(
        match.id,
        manager,
      );
      await this.listingRepository.save(listing, manager);
      await this.conversationThreadRepository.save(conversation, manager);
      await this.matchSessionRepository.save(match, manager);
    });
  }

  private async closeOriginInteraction(
    match: {
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

  private assertParticipant(
    ownerUserId: string,
    counterpartyUserId: string,
    viewerUserId: string,
  ): void {
    if (viewerUserId !== ownerUserId && viewerUserId !== counterpartyUserId) {
      throw new ForbiddenError('You can only operate on your own matches');
    }
  }

  private assertConversationOpen(state: ConversationThreadState): void {
    if (state !== ConversationThreadState.OPEN) {
      throw conversationClosedError();
    }
  }

  private async getMatchForUpdate(
    matchSessionId: string,
    manager: EntityManager,
  ) {
    const match = await this.matchSessionRepository.findByIdForUpdate(
      matchSessionId,
      manager,
    );

    if (!match) {
      throw matchNotFoundError();
    }

    return match;
  }

  private async getConversationForUpdate(
    matchSessionId: string,
    manager: EntityManager,
  ) {
    const conversation =
      await this.conversationThreadRepository.findByMatchSessionIdForUpdate(
        matchSessionId,
        manager,
      );

    if (!conversation) {
      throw conversationNotFoundError();
    }

    return conversation;
  }

  private async getConversationByIdForUpdate(
    conversationId: string,
    manager: EntityManager,
  ) {
    const conversation =
      await this.conversationThreadRepository.findByIdForUpdate(
        conversationId,
        manager,
      );

    if (!conversation) {
      throw conversationNotFoundError();
    }

    return conversation;
  }

  private async getListingForUpdate(listingId: string, manager: EntityManager) {
    const listing = await this.listingRepository.findByIdForUpdate(
      listingId,
      manager,
    );

    if (!listing) {
      throw listingNotFoundError();
    }

    return listing;
  }

  private async getMutationSurface(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    const match = await this.matchReadRepository.findMatchByIdForViewer(
      viewerUserId,
      matchSessionId,
    );

    if (!match) {
      throw matchNotFoundError();
    }

    return this.matchSurfaceBuilder.buildMutation(match, viewerUserId);
  }

  private async getConversationMutationSurface(
    viewerUserId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ConversationMessageMutationResponseDto> {
    const match =
      await this.matchReadRepository.findMatchByConversationIdForViewer(
        viewerUserId,
        conversationId,
      );

    if (!match) {
      throw conversationNotFoundError();
    }

    const messageEntity =
      await this.conversationMessageRepository.findById(messageId);

    if (!messageEntity) {
      throw conversationNotFoundError();
    }

    return this.matchSurfaceBuilder.buildConversationMutation({
      snapshot: match,
      message: {
        id: messageEntity.id,
        type: messageEntity.messageType as never,
        text: messageEntity.textBody,
        quickActionCode: messageEntity.quickActionCode as never,
        createdAt: messageEntity.createdAt.toISOString(),
        metadata: messageEntity.metadata,
        sender: {
          id: messageEntity.senderUserId,
          firstName: null,
        },
      },
      viewerUserId,
    });
  }
}

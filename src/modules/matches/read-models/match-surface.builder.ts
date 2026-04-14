import { Injectable } from '@nestjs/common';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ConversationThreadState } from '../domain/conversation-thread-state.enum';
import { MatchSessionState } from '../domain/match-session-state.enum';
import { MatchType } from '../domain/match-type.enum';
import { isMatchActive } from '../domain/match-state.policy';
import { MessageType } from '../domain/message-type.enum';
import { QuickActionCode } from '../domain/quick-action-code.enum';
import { MatchSnapshot } from '../infrastructure/match-read.repository';
import {
  MatchAvailableActionsDto,
  MatchDetailResponseDto,
  MatchItemDto,
  MatchMutationResponseDto,
} from '../presentation/dto/match-response.dto';
import {
  ConversationMessageItemDto,
  ConversationMessageMutationResponseDto,
  ConversationMessagesResponseDto,
} from '../presentation/dto/conversation-response.dto';

export interface ConversationMessageSnapshot {
  id: string;
  type: MessageType;
  text: string | null;
  quickActionCode: QuickActionCode | null;
  createdAt: string;
  metadata: Record<string, unknown>;
  sender: {
    id: string | null;
    firstName: string | null;
  };
}

@Injectable()
export class MatchSurfaceBuilder {
  buildItem(snapshot: MatchSnapshot, viewerUserId: string): MatchItemDto {
    return {
      matchSession: this.buildPayload(snapshot),
      availableActions: this.deriveAvailableActions(snapshot, viewerUserId),
    };
  }

  buildDetail(
    snapshot: MatchSnapshot,
    viewerUserId: string,
  ): MatchDetailResponseDto {
    return {
      matchSession: this.buildPayload(snapshot),
      availableActions: this.deriveAvailableActions(snapshot, viewerUserId),
    };
  }

  buildMutation(
    snapshot: MatchSnapshot,
    viewerUserId: string,
  ): MatchMutationResponseDto {
    return {
      matchSession: this.buildPayload(snapshot),
      listingState: snapshot.listing.state as ListingState,
      conversationState: snapshot.conversation.state as ConversationThreadState,
      availableActions: this.deriveAvailableActions(snapshot, viewerUserId),
    };
  }

  buildConversationMessages(input: {
    snapshot: MatchSnapshot;
    messages: ConversationMessageSnapshot[];
    viewerUserId: string;
  }): ConversationMessagesResponseDto {
    return {
      conversation: {
        id: input.snapshot.conversation.id,
        matchSessionId: input.snapshot.id,
        state: input.snapshot.conversation.state as ConversationThreadState,
      },
      items: input.messages.map((message) => this.buildMessage(message)),
      availableActions: this.deriveAvailableActions(
        input.snapshot,
        input.viewerUserId,
      ),
    };
  }

  buildConversationMutation(input: {
    snapshot: MatchSnapshot;
    message: ConversationMessageSnapshot;
    viewerUserId: string;
  }): ConversationMessageMutationResponseDto {
    return {
      conversation: {
        id: input.snapshot.conversation.id,
        matchSessionId: input.snapshot.id,
        state: input.snapshot.conversation.state as ConversationThreadState,
      },
      message: this.buildMessage(input.message),
      availableActions: this.deriveAvailableActions(
        input.snapshot,
        input.viewerUserId,
      ),
    };
  }

  deriveAvailableActions(
    snapshot: MatchSnapshot,
    viewerUserId: string,
  ): MatchAvailableActionsDto {
    const state = snapshot.state as MatchSessionState;
    const conversationState = snapshot.conversation
      .state as ConversationThreadState;
    const notExpired = new Date(snapshot.expiresAt).getTime() > Date.now();
    const viewerHasConfirmed =
      snapshot.ownerUserId === viewerUserId
        ? snapshot.successConfirmedByOwnerAt !== null
        : snapshot.successConfirmedByCounterpartyAt !== null;
    const canCommunicate =
      isMatchActive(state) &&
      notExpired &&
      conversationState === ConversationThreadState.OPEN;

    return {
      canSendMessage: canCommunicate,
      canUseQuickAction: canCommunicate,
      canConfirmSuccess:
        isMatchActive(state) && notExpired && !viewerHasConfirmed,
      canMarkFailed: isMatchActive(state) && notExpired,
      canCancel: isMatchActive(state) && notExpired,
      canShareExternalContact: false,
    };
  }

  private buildPayload(snapshot: MatchSnapshot) {
    return {
      id: snapshot.id,
      state: snapshot.state as MatchSessionState,
      type: snapshot.type as MatchType,
      expiresAt: snapshot.expiresAt,
      listing: {
        id: snapshot.listing.id,
        photo: snapshot.listing.photo,
        category: snapshot.listing.category as never,
        size: snapshot.listing.size as never,
        state: snapshot.listing.state as ListingState,
      },
      counterparty: snapshot.counterparty,
      conversation: {
        id: snapshot.conversation.id,
        state: snapshot.conversation.state as ConversationThreadState,
      },
    };
  }

  private buildMessage(
    snapshot: ConversationMessageSnapshot,
  ): ConversationMessageItemDto {
    return {
      id: snapshot.id,
      type: snapshot.type,
      text: snapshot.text,
      quickActionCode: snapshot.quickActionCode,
      createdAt: snapshot.createdAt,
      sender: snapshot.sender,
      metadata: snapshot.metadata,
    };
  }
}

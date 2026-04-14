import { Injectable } from '@nestjs/common';
import { NotificationState } from '../domain/notification-state.enum';
import { NotificationType } from '../domain/notification-type.enum';

export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  state?: NotificationState;
  readAt?: Date | null;
  archivedAt?: Date | null;
}

@Injectable()
export class NotificationContentFactory {
  buildPurchaseIntentReceived(input: {
    userId: string;
    listingId: string;
    purchaseIntentId: string;
    buyerUserId: string;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.PURCHASE_INTENT_RECEIVED,
      title: 'Recibiste una intención de compra',
      body: 'Una persona quiere comprar tu publicación.',
      payload: {
        listingId: input.listingId,
        purchaseIntentId: input.purchaseIntentId,
        buyerUserId: input.buyerUserId,
        interactionType: 'PURCHASE_INTENT',
      },
    };
  }

  buildTradeProposalReceived(input: {
    userId: string;
    listingId: string;
    tradeProposalId: string;
    proposerUserId: string;
    proposedListingIds: string[];
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.TRADE_PROPOSAL_RECEIVED,
      title: 'Recibiste una propuesta de permuta',
      body: 'Una persona te propuso intercambiar prendas por tu publicación.',
      payload: {
        listingId: input.listingId,
        tradeProposalId: input.tradeProposalId,
        proposerUserId: input.proposerUserId,
        proposedListingIds: input.proposedListingIds,
        interactionType: 'TRADE_PROPOSAL',
      },
    };
  }

  buildInteractionAccepted(input: {
    userId: string;
    listingId: string;
    interactionId: string;
    interactionType: 'PURCHASE_INTENT' | 'TRADE_PROPOSAL';
    matchSessionId: string;
    conversationThreadId: string;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.INTERACTION_ACCEPTED,
      title: 'Aceptaron tu interacción',
      body:
        input.interactionType === 'PURCHASE_INTENT'
          ? 'Tu intención de compra fue aceptada.'
          : 'Tu propuesta de permuta fue aceptada.',
      payload: {
        listingId: input.listingId,
        interactionId: input.interactionId,
        interactionType: input.interactionType,
        matchSessionId: input.matchSessionId,
        conversationThreadId: input.conversationThreadId,
      },
    };
  }

  buildInteractionRejected(input: {
    userId: string;
    listingId: string;
    interactionId: string;
    interactionType: 'PURCHASE_INTENT' | 'TRADE_PROPOSAL';
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.INTERACTION_REJECTED,
      title: 'No siguió adelante tu interacción',
      body:
        input.interactionType === 'PURCHASE_INTENT'
          ? 'Tu intención de compra fue rechazada.'
          : 'Tu propuesta de permuta fue rechazada.',
      payload: {
        listingId: input.listingId,
        interactionId: input.interactionId,
        interactionType: input.interactionType,
      },
    };
  }

  buildNewConversationMessage(input: {
    userId: string;
    matchSessionId: string;
    conversationThreadId: string;
    messageId: string;
    senderUserId: string;
    messageType: string;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.NEW_CONVERSATION_MESSAGE,
      title: 'Tenés un nuevo mensaje',
      body: 'Hay actividad nueva en una conversación activa.',
      payload: {
        matchSessionId: input.matchSessionId,
        conversationThreadId: input.conversationThreadId,
        messageId: input.messageId,
        senderUserId: input.senderUserId,
        messageType: input.messageType,
      },
    };
  }

  buildListingObserved(input: {
    userId: string;
    listingId: string;
    moderationReasons: string[];
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.LISTING_OBSERVED,
      title: 'Tu publicación necesita ajustes',
      body: 'Detectamos observaciones que tenés que corregir antes de avanzar.',
      payload: {
        listingId: input.listingId,
        moderationReasons: input.moderationReasons,
      },
    };
  }

  buildListingRejected(input: {
    userId: string;
    listingId: string;
    moderationReasons: string[];
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.LISTING_REJECTED,
      title: 'Tu publicación fue rechazada',
      body: 'La publicación no pudo aprobarse con la información actual.',
      payload: {
        listingId: input.listingId,
        moderationReasons: input.moderationReasons,
      },
    };
  }

  buildReservationExpiring(input: {
    userId: string;
    listingId: string;
    matchSessionId: string;
    expiresAt: Date;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.RESERVATION_EXPIRING,
      title: 'Tu reserva está por vencer',
      body: 'La coordinación sigue abierta pero está cerca de expirar.',
      payload: {
        listingId: input.listingId,
        matchSessionId: input.matchSessionId,
        expiresAt: input.expiresAt.toISOString(),
      },
    };
  }

  buildReservationExpired(input: {
    userId: string;
    listingId: string;
    matchSessionId: string;
    expiredAt: Date;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.RESERVATION_EXPIRED,
      title: 'La reserva expiró',
      body: 'La coordinación venció y la publicación volvió a estar disponible.',
      payload: {
        listingId: input.listingId,
        matchSessionId: input.matchSessionId,
        expiredAt: input.expiredAt.toISOString(),
      },
    };
  }

  buildMatchCompleted(input: {
    userId: string;
    listingId: string;
    matchSessionId: string;
    completedAt: Date;
  }): CreateNotificationPayload {
    return {
      userId: input.userId,
      type: NotificationType.MATCH_COMPLETED,
      title: 'La operación se completó',
      body: 'Ambas partes confirmaron que la coordinación salió bien.',
      payload: {
        listingId: input.listingId,
        matchSessionId: input.matchSessionId,
        completedAt: input.completedAt.toISOString(),
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotificationEntity } from '../domain/notification.entity';
import { NotificationState } from '../domain/notification-state.enum';
import { notificationNotFoundError } from '../domain/notification-errors';
import {
  CreateNotificationPayload,
  NotificationContentFactory,
} from './notification-content.factory';
import { NotificationRepository } from '../infrastructure/notification.repository';
import { NotificationMutationResponseDto } from '../presentation/dto/notification-response.dto';
import { NotificationItemBuilder } from '../read-models/notification-item.builder';

@Injectable()
export class NotificationCommandService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationContentFactory: NotificationContentFactory,
    private readonly notificationItemBuilder: NotificationItemBuilder,
  ) {}

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationMutationResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const notification = await this.getOwnedNotificationForUpdate(
        notificationId,
        userId,
        manager,
      );

      if (
        (notification.state as NotificationState) === NotificationState.UNREAD
      ) {
        notification.state = NotificationState.READ;
        notification.readAt = notification.readAt ?? new Date();
        await this.notificationRepository.save(notification, manager);
      }

      return this.notificationItemBuilder.buildMutation(notification);
    });
  }

  async markAllRead(userId: string): Promise<{ updatedCount: number }> {
    const updatedCount =
      await this.notificationRepository.markAllUnreadAsRead(userId);

    return { updatedCount };
  }

  async notifyPurchaseIntentReceived(
    input: {
      userId: string;
      listingId: string;
      purchaseIntentId: string;
      buyerUserId: string;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildPurchaseIntentReceived(input),
      manager,
    );
  }

  async notifyTradeProposalReceived(
    input: {
      userId: string;
      listingId: string;
      tradeProposalId: string;
      proposerUserId: string;
      proposedListingIds: string[];
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildTradeProposalReceived(input),
      manager,
    );
  }

  async notifyInteractionAccepted(
    input: {
      userId: string;
      listingId: string;
      interactionId: string;
      interactionType: 'PURCHASE_INTENT' | 'TRADE_PROPOSAL';
      matchSessionId: string;
      conversationThreadId: string;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildInteractionAccepted(input),
      manager,
    );
  }

  async notifyInteractionRejected(
    input: {
      userId: string;
      listingId: string;
      interactionId: string;
      interactionType: 'PURCHASE_INTENT' | 'TRADE_PROPOSAL';
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildInteractionRejected(input),
      manager,
    );
  }

  async notifyNewConversationMessage(
    input: {
      userId: string;
      matchSessionId: string;
      conversationThreadId: string;
      messageId: string;
      senderUserId: string;
      messageType: string;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildNewConversationMessage(input),
      manager,
    );
  }

  async notifyListingObserved(
    input: {
      userId: string;
      listingId: string;
      moderationReasons: string[];
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildListingObserved(input),
      manager,
    );
  }

  async notifyListingRejected(
    input: {
      userId: string;
      listingId: string;
      moderationReasons: string[];
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildListingRejected(input),
      manager,
    );
  }

  async notifyReservationExpiring(
    input: {
      userId: string;
      listingId: string;
      matchSessionId: string;
      expiresAt: Date;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildReservationExpiring(input),
      manager,
    );
  }

  async notifyReservationExpired(
    input: {
      userId: string;
      listingId: string;
      matchSessionId: string;
      expiredAt: Date;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.create(
      this.notificationContentFactory.buildReservationExpired(input),
      manager,
    );
  }

  async notifyMatchCompletedMany(
    input: Array<{
      userId: string;
      listingId: string;
      matchSessionId: string;
      completedAt: Date;
    }>,
    manager?: EntityManager,
  ): Promise<NotificationEntity[]> {
    return this.createMany(
      input.map((item) =>
        this.notificationContentFactory.buildMatchCompleted(item),
      ),
      manager,
    );
  }

  async create(
    data: CreateNotificationPayload,
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    return this.notificationRepository.create(
      {
        userId: data.userId,
        type: data.type,
        state: data.state ?? NotificationState.UNREAD,
        title: data.title,
        body: data.body,
        payload: data.payload,
        readAt: data.readAt ?? null,
        archivedAt: data.archivedAt ?? null,
      },
      manager,
    );
  }

  async createMany(
    data: CreateNotificationPayload[],
    manager?: EntityManager,
  ): Promise<NotificationEntity[]> {
    return this.notificationRepository.createMany(
      data.map((item) => ({
        userId: item.userId,
        type: item.type,
        state: item.state ?? NotificationState.UNREAD,
        title: item.title,
        body: item.body,
        payload: item.payload,
        readAt: item.readAt ?? null,
        archivedAt: item.archivedAt ?? null,
      })),
      manager,
    );
  }

  private async getOwnedNotificationForUpdate(
    notificationId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepository.findByIdForUpdate(
      notificationId,
      manager,
    );

    if (!notification) {
      throw notificationNotFoundError();
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You can only access your own notifications');
    }

    return notification;
  }
}

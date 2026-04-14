import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../domain/notification.entity';
import { NotificationState } from '../domain/notification-state.enum';
import {
  NotificationItemDto,
  NotificationMutationResponseDto,
} from '../presentation/dto/notification-response.dto';

@Injectable()
export class NotificationItemBuilder {
  buildItem(notification: NotificationEntity): NotificationItemDto {
    return {
      id: notification.id,
      type: notification.type as never,
      state: notification.state as never,
      title: notification.title,
      body: notification.body,
      payload: notification.payload,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
      availableActions: {
        canMarkRead:
          (notification.state as NotificationState) ===
          NotificationState.UNREAD,
      },
    };
  }

  buildMutation(
    notification: NotificationEntity,
  ): NotificationMutationResponseDto {
    return {
      notification: this.buildItem(notification),
    };
  }
}

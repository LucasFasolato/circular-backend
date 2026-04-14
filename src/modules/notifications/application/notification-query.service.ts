import { Injectable } from '@nestjs/common';
import {
  decodeCursor,
  encodeCursor,
} from '../../../common/application/cursor-pagination';
import { withResponseMeta } from '../../../common/application/response-meta';
import { NotificationReadRepository } from '../infrastructure/notification-read.repository';
import { ListNotificationsQueryDto } from '../presentation/dto/list-notifications-query.dto';
import { NotificationsResponseDto } from '../presentation/dto/notification-response.dto';
import { NotificationItemBuilder } from '../read-models/notification-item.builder';

type NotificationsCursorPayload = Record<'createdAt' | 'id', string>;

@Injectable()
export class NotificationQueryService {
  constructor(
    private readonly notificationReadRepository: NotificationReadRepository,
    private readonly notificationItemBuilder: NotificationItemBuilder,
  ) {}

  async getMine(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationsResponseDto> {
    const decodedCursor = query.cursor
      ? decodeCursor<NotificationsCursorPayload>(query.cursor)
      : undefined;
    const notifications =
      await this.notificationReadRepository.findPageByUserId(
        userId,
        query.limit + 1,
        decodedCursor,
      );
    const hasMore = notifications.length > query.limit;
    const pageItems = notifications.slice(0, query.limit);
    const nextCursor =
      hasMore && pageItems.length > 0
        ? encodeCursor({
            createdAt: pageItems[pageItems.length - 1].createdAt.toISOString(),
            id: pageItems[pageItems.length - 1].id,
          })
        : null;

    return withResponseMeta(
      {
        items: pageItems.map((notification) =>
          this.notificationItemBuilder.buildItem(notification),
        ),
      },
      {
        nextCursor,
      },
    );
  }
}

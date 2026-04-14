import { NotificationQueryService } from './notification-query.service';
import { NotificationReadRepository } from '../infrastructure/notification-read.repository';
import { NotificationItemBuilder } from '../read-models/notification-item.builder';
import { NotificationState } from '../domain/notification-state.enum';
import { NotificationType } from '../domain/notification-type.enum';

describe('NotificationQueryService', () => {
  it('lists notifications with stable cursor pagination in descending order', async () => {
    const notificationReadRepository = {
      findPageByUserId: jest.fn().mockResolvedValue([
        {
          id: 'n-3',
          type: NotificationType.MATCH_COMPLETED,
          state: NotificationState.UNREAD,
          title: 'Tres',
          body: null,
          payload: {},
          createdAt: new Date('2026-04-14T12:00:03.000Z'),
          readAt: null,
        },
        {
          id: 'n-2',
          type: NotificationType.INTERACTION_ACCEPTED,
          state: NotificationState.READ,
          title: 'Dos',
          body: null,
          payload: {},
          createdAt: new Date('2026-04-14T12:00:02.000Z'),
          readAt: new Date('2026-04-14T12:05:00.000Z'),
        },
      ]),
    } as unknown as NotificationReadRepository;

    const service = new NotificationQueryService(
      notificationReadRepository,
      new NotificationItemBuilder(),
    );

    const result = await service.getMine('usr-1', { limit: 1 });
    const meta = (result as { __meta?: unknown }).__meta;

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('n-3');
    expect(meta).toBeDefined();
    expect(typeof (meta as { nextCursor?: unknown }).nextCursor).toBe('string');
  });
});

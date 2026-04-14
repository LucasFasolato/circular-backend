import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { NotificationCommandService } from './notification-command.service';
import { NotificationContentFactory } from './notification-content.factory';
import { NotificationEntity } from '../domain/notification.entity';
import { NotificationState } from '../domain/notification-state.enum';
import { NotificationType } from '../domain/notification-type.enum';
import { NotificationRepository } from '../infrastructure/notification.repository';
import { NotificationItemBuilder } from '../read-models/notification-item.builder';

describe('NotificationCommandService', () => {
  function createNotification(
    overrides?: Partial<NotificationEntity>,
  ): NotificationEntity {
    return {
      id: 'ntf-1',
      userId: 'usr-1',
      type: NotificationType.PURCHASE_INTENT_RECEIVED,
      state: NotificationState.UNREAD,
      title: 'Title',
      body: 'Body',
      payload: { listingId: 'lst-1' },
      readAt: null,
      archivedAt: null,
      createdAt: new Date('2026-04-14T12:00:00.000Z'),
      ...overrides,
    } as NotificationEntity;
  }

  function createService(overrides?: {
    notification?: Partial<NotificationEntity>;
  }) {
    const notification = createNotification(overrides?.notification);
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const dataSource = { transaction };
    const save = jest
      .fn()
      .mockImplementation((entity: NotificationEntity) =>
        Promise.resolve(entity),
      );
    const markAllUnreadAsRead = jest.fn().mockResolvedValue(3);
    const create = jest
      .fn()
      .mockImplementation((data: Partial<NotificationEntity>) =>
        Promise.resolve({
          ...createNotification(),
          ...data,
        }),
      );
    const createMany = jest
      .fn()
      .mockImplementation((items: Array<Partial<NotificationEntity>>) =>
        Promise.resolve(
          items.map((item) => ({
            ...createNotification(),
            ...item,
          })),
        ),
      );
    const notificationRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(notification),
      save,
      markAllUnreadAsRead,
      create,
      createMany,
    } as unknown as NotificationRepository;

    return {
      service: new NotificationCommandService(
        dataSource as never,
        notificationRepository,
        new NotificationContentFactory(),
        new NotificationItemBuilder(),
      ),
      save,
      markAllUnreadAsRead,
    };
  }

  it('marks a notification as read only for its owner', async () => {
    const { service, save } = createService();

    const result = await service.markRead('usr-1', 'ntf-1');

    expect(save).toHaveBeenCalled();
    expect(result.notification.state).toBe(NotificationState.READ);
    expect(result.notification.availableActions.canMarkRead).toBe(false);
  });

  it('is idempotent when the notification is already read', async () => {
    const { service, save } = createService({
      notification: {
        state: NotificationState.READ,
        readAt: new Date('2026-04-14T12:10:00.000Z'),
      },
    });

    const result = await service.markRead('usr-1', 'ntf-1');

    expect(save).not.toHaveBeenCalled();
    expect(result.notification.state).toBe(NotificationState.READ);
  });

  it('forbids marking another user notification as read', async () => {
    const { service } = createService({
      notification: { userId: 'usr-2' },
    });

    await expect(service.markRead('usr-1', 'ntf-1')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('marks all unread notifications as read without touching archived ones', async () => {
    const { service, markAllUnreadAsRead } = createService();

    const result = await service.markAllRead('usr-1');

    expect(markAllUnreadAsRead).toHaveBeenCalledWith('usr-1');
    expect(result.updatedCount).toBe(3);
  });
});

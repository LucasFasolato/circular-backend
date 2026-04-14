import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationEntity } from '../domain/notification.entity';
import { NotificationState } from '../domain/notification-state.enum';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async create(
    data: Partial<NotificationEntity>,
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    const repo = manager
      ? manager.getRepository(NotificationEntity)
      : this.repo;
    return repo.save(
      repo.create({
        state: NotificationState.UNREAD,
        readAt: null,
        archivedAt: null,
        ...data,
      }),
    );
  }

  async createMany(
    data: Array<Partial<NotificationEntity>>,
    manager?: EntityManager,
  ): Promise<NotificationEntity[]> {
    if (data.length === 0) {
      return [];
    }

    const repo = manager
      ? manager.getRepository(NotificationEntity)
      : this.repo;
    return repo.save(
      repo.create(
        data.map((item) => ({
          state: NotificationState.UNREAD,
          readAt: null,
          archivedAt: null,
          ...item,
        })),
      ),
    );
  }

  async findById(notificationId: string): Promise<NotificationEntity | null> {
    return this.repo.findOne({ where: { id: notificationId } });
  }

  async findByIdForUpdate(
    notificationId: string,
    manager: EntityManager,
  ): Promise<NotificationEntity | null> {
    return manager
      .getRepository(NotificationEntity)
      .createQueryBuilder('notification')
      .setLock('pessimistic_write')
      .where('notification.id = :notificationId', { notificationId })
      .getOne();
  }

  async save(
    entity: NotificationEntity,
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    const repo = manager
      ? manager.getRepository(NotificationEntity)
      : this.repo;
    return repo.save(entity);
  }

  async markAllUnreadAsRead(
    userId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(NotificationEntity)
      : this.repo;
    const result = await repo
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({
        state: NotificationState.READ,
        readAt: () => 'NOW()' as never,
      })
      .where('user_id = :userId', { userId })
      .andWhere('state = :unreadState', {
        unreadState: NotificationState.UNREAD,
      })
      .andWhere('archived_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }
}

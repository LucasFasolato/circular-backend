import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { NotificationEntity } from '../domain/notification.entity';

export interface NotificationsCursor {
  createdAt: string;
  id: string;
}

@Injectable()
export class NotificationReadRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async findPageByUserId(
    userId: string,
    limit: number,
    cursor?: NotificationsCursor,
  ): Promise<NotificationEntity[]> {
    const qb = this.repo
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .addOrderBy('notification.id', 'DESC')
      .take(limit);

    if (cursor) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('notification.created_at < :cursorCreatedAt', {
              cursorCreatedAt: cursor.createdAt,
            })
            .orWhere(
              'notification.created_at = :cursorCreatedAt AND notification.id < :cursorId',
              {
                cursorCreatedAt: cursor.createdAt,
                cursorId: cursor.id,
              },
            );
        }),
      );
    }

    return qb.getMany();
  }
}

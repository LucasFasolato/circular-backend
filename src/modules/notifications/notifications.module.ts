import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/domain/user.entity';
import { NotificationCommandService } from './application/notification-command.service';
import { NotificationContentFactory } from './application/notification-content.factory';
import { NotificationQueryService } from './application/notification-query.service';
import { NotificationEntity } from './domain/notification.entity';
import { NotificationReadRepository } from './infrastructure/notification-read.repository';
import { NotificationRepository } from './infrastructure/notification.repository';
import { NotificationsController } from './presentation/notifications.controller';
import { NotificationItemBuilder } from './read-models/notification-item.builder';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, NotificationEntity])],
  controllers: [NotificationsController],
  providers: [
    NotificationRepository,
    NotificationReadRepository,
    NotificationContentFactory,
    NotificationItemBuilder,
    NotificationCommandService,
    NotificationQueryService,
  ],
  exports: [NotificationCommandService, NotificationQueryService],
})
export class NotificationsModule {}

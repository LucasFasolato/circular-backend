import { ApiProperty } from '@nestjs/swagger';
import { NotificationState } from '../../domain/notification-state.enum';
import { NotificationType } from '../../domain/notification-type.enum';

export class NotificationAvailableActionsDto {
  @ApiProperty()
  canMarkRead: boolean;
}

export class NotificationItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ enum: NotificationState })
  state: NotificationState;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  body: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payload: Record<string, unknown>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ nullable: true })
  readAt: string | null;

  @ApiProperty({ type: NotificationAvailableActionsDto })
  availableActions: NotificationAvailableActionsDto;
}

export class NotificationsResponseDto {
  @ApiProperty({ type: [NotificationItemDto] })
  items: NotificationItemDto[];
}

export class NotificationMutationResponseDto {
  @ApiProperty({ type: NotificationItemDto })
  notification: NotificationItemDto;
}

export class ReadAllNotificationsResponseDto {
  @ApiProperty()
  updatedCount: number;
}

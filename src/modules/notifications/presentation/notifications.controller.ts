import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/current-user.decorator';
import { RequestUser } from '../../../shared/request-user.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { NotificationCommandService } from '../application/notification-command.service';
import { NotificationQueryService } from '../application/notification-query.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import {
  NotificationMutationResponseDto,
  NotificationsResponseDto,
  ReadAllNotificationsResponseDto,
} from './dto/notification-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(
    private readonly notificationQueryService: NotificationQueryService,
    private readonly notificationCommandService: NotificationCommandService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({ status: 200, type: NotificationsResponseDto })
  async getMine(
    @CurrentUser() user: RequestUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationsResponseDto> {
    return this.notificationQueryService.getMine(user.id, query);
  }

  @Post(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, type: NotificationMutationResponseDto })
  async markRead(
    @CurrentUser() user: RequestUser,
    @Param('notificationId', new ParseUUIDPipe()) notificationId: string,
  ): Promise<NotificationMutationResponseDto> {
    return this.notificationCommandService.markRead(user.id, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 200, type: ReadAllNotificationsResponseDto })
  async markAllRead(
    @CurrentUser() user: RequestUser,
  ): Promise<ReadAllNotificationsResponseDto> {
    return this.notificationCommandService.markAllRead(user.id);
  }
}

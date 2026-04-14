import {
  Body,
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
import { MatchCommandService } from '../application/match-command.service';
import { MatchQueryService } from '../application/match-query.service';
import {
  ConversationMessageMutationResponseDto,
  ConversationMessagesResponseDto,
} from './dto/conversation-response.dto';
import { ListConversationMessagesQueryDto } from './dto/list-conversation-messages-query.dto';
import { SendConversationMessageDto } from './dto/send-conversation-message.dto';
import { UseQuickActionDto } from './dto/use-quick-action.dto';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConversationsController {
  constructor(
    private readonly matchQueryService: MatchQueryService,
    private readonly matchCommandService: MatchCommandService,
  ) {}

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'List conversation messages' })
  @ApiResponse({ status: 200, type: ConversationMessagesResponseDto })
  async getMessages(
    @CurrentUser() user: RequestUser,
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Query() query: ListConversationMessagesQueryDto,
  ) {
    return this.matchQueryService.getConversationMessages(
      user.id,
      conversationId,
      query,
    );
  }

  @Post(':conversationId/messages')
  @ApiOperation({ summary: 'Send a text message in an active conversation' })
  @ApiResponse({ status: 201, type: ConversationMessageMutationResponseDto })
  async sendMessage(
    @CurrentUser() user: RequestUser,
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Body() dto: SendConversationMessageDto,
  ): Promise<ConversationMessageMutationResponseDto> {
    return this.matchCommandService.sendMessage(
      user.id,
      conversationId,
      dto.text,
    );
  }

  @Post(':conversationId/quick-actions')
  @ApiOperation({
    summary: 'Send a guided quick action in an active conversation',
  })
  @ApiResponse({ status: 201, type: ConversationMessageMutationResponseDto })
  async useQuickAction(
    @CurrentUser() user: RequestUser,
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
    @Body() dto: UseQuickActionDto,
  ): Promise<ConversationMessageMutationResponseDto> {
    return this.matchCommandService.useQuickAction(
      user.id,
      conversationId,
      dto.action,
    );
  }
}

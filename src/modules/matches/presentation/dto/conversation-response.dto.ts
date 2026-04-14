import { ApiProperty } from '@nestjs/swagger';
import { ConversationThreadState } from '../../domain/conversation-thread-state.enum';
import { MessageType } from '../../domain/message-type.enum';
import { QuickActionCode } from '../../domain/quick-action-code.enum';
import { MatchAvailableActionsDto } from './match-response.dto';

export class ConversationParticipantDto {
  @ApiProperty({ nullable: true })
  id: string | null;

  @ApiProperty({ nullable: true })
  firstName: string | null;
}

export class ConversationMessageItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiProperty({ nullable: true })
  text: string | null;

  @ApiProperty({ enum: QuickActionCode, nullable: true })
  quickActionCode: QuickActionCode | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: ConversationParticipantDto })
  sender: ConversationParticipantDto;

  @ApiProperty()
  metadata: Record<string, unknown>;
}

export class ConversationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matchSessionId: string;

  @ApiProperty({ enum: ConversationThreadState })
  state: ConversationThreadState;
}

export class ConversationMessagesResponseDto {
  @ApiProperty({ type: ConversationSummaryDto })
  conversation: ConversationSummaryDto;

  @ApiProperty({ type: [ConversationMessageItemDto] })
  items: ConversationMessageItemDto[];

  @ApiProperty({ type: MatchAvailableActionsDto })
  availableActions: MatchAvailableActionsDto;
}

export class ConversationMessageMutationResponseDto {
  @ApiProperty({ type: ConversationSummaryDto })
  conversation: ConversationSummaryDto;

  @ApiProperty({ type: ConversationMessageItemDto })
  message: ConversationMessageItemDto;

  @ApiProperty({ type: MatchAvailableActionsDto })
  availableActions: MatchAvailableActionsDto;
}

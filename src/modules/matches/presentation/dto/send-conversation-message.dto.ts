import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsString, MaxLength, MinLength } from 'class-validator';
import { MATCH_LIMITS } from '../../domain/match-limits.constants';
import { MessageType } from '../../domain/message-type.enum';

export class SendConversationMessageDto {
  @ApiProperty({ enum: MessageType, default: MessageType.TEXT })
  @Equals(MessageType.TEXT)
  type: MessageType.TEXT;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(MATCH_LIMITS.MAX_MESSAGE_LENGTH)
  text: string;
}

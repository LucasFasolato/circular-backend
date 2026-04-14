import { ApiProperty } from '@nestjs/swagger';
import { ListingCategory } from '../../../listings/domain/listing-category.enum';
import { GarmentSize } from '../../../listings/domain/garment-size.enum';
import { ListingState } from '../../../listings/domain/listing-state.enum';
import { ConversationThreadState } from '../../domain/conversation-thread-state.enum';
import { MatchSessionState } from '../../domain/match-session-state.enum';
import { MatchType } from '../../domain/match-type.enum';

export class MatchListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  photo: string | null;

  @ApiProperty({ enum: ListingCategory })
  category: ListingCategory;

  @ApiProperty({ enum: GarmentSize })
  size: GarmentSize;

  @ApiProperty({ enum: ListingState })
  state: ListingState;
}

export class MatchCounterpartySummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ nullable: true })
  instagramHandle: string | null;
}

export class MatchConversationSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ConversationThreadState })
  state: ConversationThreadState;
}

export class MatchAvailableActionsDto {
  @ApiProperty()
  canSendMessage: boolean;

  @ApiProperty()
  canUseQuickAction: boolean;

  @ApiProperty()
  canConfirmSuccess: boolean;

  @ApiProperty()
  canMarkFailed: boolean;

  @ApiProperty()
  canCancel: boolean;

  @ApiProperty()
  canShareExternalContact: boolean;
}

export class MatchSessionPayloadDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: MatchSessionState })
  state: MatchSessionState;

  @ApiProperty({ enum: MatchType })
  type: MatchType;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty({ type: MatchListingSummaryDto })
  listing: MatchListingSummaryDto;

  @ApiProperty({ type: MatchCounterpartySummaryDto })
  counterparty: MatchCounterpartySummaryDto;

  @ApiProperty({ type: MatchConversationSummaryDto })
  conversation: MatchConversationSummaryDto;
}

export class MatchItemDto {
  @ApiProperty({ type: MatchSessionPayloadDto })
  matchSession: MatchSessionPayloadDto;

  @ApiProperty({ type: MatchAvailableActionsDto })
  availableActions: MatchAvailableActionsDto;
}

export class MyMatchesResponseDto {
  @ApiProperty({ type: [MatchItemDto] })
  items: MatchItemDto[];
}

export class MatchDetailResponseDto {
  @ApiProperty({ type: MatchSessionPayloadDto })
  matchSession: MatchSessionPayloadDto;

  @ApiProperty({ type: MatchAvailableActionsDto })
  availableActions: MatchAvailableActionsDto;
}

export class MatchMutationResponseDto {
  @ApiProperty({ type: MatchSessionPayloadDto })
  matchSession: MatchSessionPayloadDto;

  @ApiProperty({ enum: ListingState })
  listingState: ListingState;

  @ApiProperty({ enum: ConversationThreadState })
  conversationState: ConversationThreadState;

  @ApiProperty({ type: MatchAvailableActionsDto })
  availableActions: MatchAvailableActionsDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { InteractionType } from '../../domain/interaction-type.enum';

export class IncomingInteractionListingDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  photo: string | null;

  @ApiProperty()
  category: string;

  @ApiProperty()
  size: string;
}

export class IncomingInteractionTrustDto {
  @ApiProperty()
  completedTransactions: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty({ nullable: true })
  avgResponseTimeHours: number | null;
}

export class IncomingInteractionInterestedUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ type: IncomingInteractionTrustDto })
  trust: IncomingInteractionTrustDto;
}

export class IncomingInteractionAvailableActionsDto {
  @ApiProperty()
  canAccept: boolean;

  @ApiProperty()
  canReject: boolean;

  @ApiProperty()
  canViewInterestedProfile: boolean;

  @ApiProperty()
  canViewProposedItems: boolean;
}

export class IncomingInteractionItemDto {
  @ApiProperty({ enum: InteractionType })
  interactionType: InteractionType;

  @ApiProperty()
  id: string;

  @ApiProperty()
  state: string;

  @ApiProperty({ type: IncomingInteractionListingDto })
  targetListing: IncomingInteractionListingDto;

  @ApiProperty({ type: IncomingInteractionInterestedUserDto })
  interestedUser: IncomingInteractionInterestedUserDto;

  @ApiProperty({ type: [IncomingInteractionListingDto], nullable: true })
  proposedItems: IncomingInteractionListingDto[] | null;

  @ApiProperty({ type: IncomingInteractionAvailableActionsDto })
  availableActions: IncomingInteractionAvailableActionsDto;
}

export class IncomingInteractionsResponseDto {
  @ApiProperty({ type: [IncomingInteractionItemDto] })
  items: IncomingInteractionItemDto[];
}

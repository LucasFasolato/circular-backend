import { ApiProperty } from '@nestjs/swagger';
import { InteractionType } from '../../domain/interaction-type.enum';
import { PurchaseIntentState } from '../../domain/purchase-intent-state.enum';
import { TradeProposalState } from '../../domain/trade-proposal-state.enum';
import { ListingState } from '../../../listings/domain/listing-state.enum';

export class CreateInteractionAvailableActionsDto {
  @ApiProperty()
  canCancel: boolean;
}

export class PurchaseIntentPayloadDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PurchaseIntentState })
  state: PurchaseIntentState;

  @ApiProperty()
  listingId: string;

  @ApiProperty()
  createdAt: string;
}

export class PurchaseIntentMutationResponseDto {
  @ApiProperty({ type: PurchaseIntentPayloadDto })
  purchaseIntent: PurchaseIntentPayloadDto;

  @ApiProperty({ type: CreateInteractionAvailableActionsDto })
  availableActions: CreateInteractionAvailableActionsDto;
}

export class TradeProposalPayloadDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TradeProposalState })
  state: TradeProposalState;

  @ApiProperty()
  listingId: string;

  @ApiProperty({ type: [String] })
  proposedListingIds: string[];

  @ApiProperty()
  createdAt: string;
}

export class TradeProposalMutationResponseDto {
  @ApiProperty({ type: TradeProposalPayloadDto })
  tradeProposal: TradeProposalPayloadDto;

  @ApiProperty({ type: CreateInteractionAvailableActionsDto })
  availableActions: CreateInteractionAvailableActionsDto;
}

export class InteractionResolutionAvailableActionsDto {
  @ApiProperty()
  canCancel: boolean;

  @ApiProperty()
  canAccept: boolean;

  @ApiProperty()
  canReject: boolean;
}

export class InteractionResolutionListingDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ListingState })
  state: ListingState;

  @ApiProperty({ nullable: true })
  reservationExpiresAt: string | null;
}

export class InteractionResolutionResponseDto {
  @ApiProperty({ enum: InteractionType })
  interactionType: InteractionType;

  @ApiProperty()
  interactionId: string;

  @ApiProperty()
  state: string;

  @ApiProperty({ type: InteractionResolutionListingDto })
  listing: InteractionResolutionListingDto;

  @ApiProperty({ nullable: true })
  matchSessionId: string | null;

  @ApiProperty({ nullable: true })
  conversationThreadId: string | null;

  @ApiProperty({ type: InteractionResolutionAvailableActionsDto })
  availableActions: InteractionResolutionAvailableActionsDto;
}

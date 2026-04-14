import { Injectable } from '@nestjs/common';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { InteractionType } from '../domain/interaction-type.enum';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';
import {
  InteractionResolutionResponseDto,
  PurchaseIntentMutationResponseDto,
  TradeProposalMutationResponseDto,
} from '../presentation/dto/interaction-response.dto';

@Injectable()
export class InteractionResponseFactory {
  buildPurchaseIntentMutation(input: {
    id: string;
    state: PurchaseIntentState;
    listingId: string;
    createdAt: Date;
    canCancel: boolean;
  }): PurchaseIntentMutationResponseDto {
    return {
      purchaseIntent: {
        id: input.id,
        state: input.state,
        listingId: input.listingId,
        createdAt: input.createdAt.toISOString(),
      },
      availableActions: {
        canCancel: input.canCancel,
      },
    };
  }

  buildTradeProposalMutation(input: {
    id: string;
    state: TradeProposalState;
    listingId: string;
    proposedListingIds: string[];
    createdAt: Date;
    canCancel: boolean;
  }): TradeProposalMutationResponseDto {
    return {
      tradeProposal: {
        id: input.id,
        state: input.state,
        listingId: input.listingId,
        proposedListingIds: input.proposedListingIds,
        createdAt: input.createdAt.toISOString(),
      },
      availableActions: {
        canCancel: input.canCancel,
      },
    };
  }

  buildResolutionResponse(input: {
    interactionType: InteractionType;
    interactionId: string;
    state: string;
    listingId: string;
    listingState: ListingState;
    reservationExpiresAt: Date | null;
    matchSessionId?: string | null;
    conversationThreadId?: string | null;
  }): InteractionResolutionResponseDto {
    return {
      interactionType: input.interactionType,
      interactionId: input.interactionId,
      state: input.state,
      listing: {
        id: input.listingId,
        state: input.listingState,
        reservationExpiresAt: input.reservationExpiresAt?.toISOString() ?? null,
      },
      matchSessionId: input.matchSessionId ?? null,
      conversationThreadId: input.conversationThreadId ?? null,
      availableActions: {
        canCancel: false,
        canAccept: false,
        canReject: false,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { IncomingInteractionItemDto } from '../presentation/dto/incoming-interactions-response.dto';
import { InteractionType } from '../domain/interaction-type.enum';

export interface IncomingInteractionSnapshot {
  interactionType: InteractionType;
  id: string;
  state: string;
  targetListing: {
    id: string;
    photo: string | null;
    category: string;
    size: string;
  };
  interestedUser: {
    id: string;
    firstName: string;
    trust: {
      completedTransactions: number;
      successRate: number;
      avgResponseTimeHours: number | null;
    };
  };
  proposedItems: Array<{
    id: string;
    photo: string | null;
    category: string;
    size: string;
  }> | null;
}

@Injectable()
export class IncomingInteractionItemBuilder {
  build(snapshot: IncomingInteractionSnapshot): IncomingInteractionItemDto {
    return {
      interactionType: snapshot.interactionType,
      id: snapshot.id,
      state: snapshot.state,
      targetListing: snapshot.targetListing,
      interestedUser: snapshot.interestedUser,
      proposedItems: snapshot.proposedItems,
      availableActions: {
        canAccept: snapshot.state === 'ACTIVE',
        canReject: snapshot.state === 'ACTIVE',
        canViewInterestedProfile: true,
        canViewProposedItems:
          snapshot.interactionType === InteractionType.TRADE_PROPOSAL,
      },
    };
  }
}

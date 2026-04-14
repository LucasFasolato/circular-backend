import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MatchesModule } from '../matches/matches.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../auth/domain/user.entity';
import { PublicProfileEntity } from '../profiles/domain/public-profile.entity';
import { ReputationProfileEntity } from '../profiles/domain/reputation-profile.entity';
import { GarmentEntity } from '../listings/domain/garment.entity';
import { ListingEntity } from '../listings/domain/listing.entity';
import { ListingPhotoEntity } from '../listings/domain/listing-photo.entity';
import { ListingRepository } from '../listings/infrastructure/listing.repository';
import { AcceptPurchaseIntentService } from './application/accept-purchase-intent.service';
import { AcceptTradeProposalService } from './application/accept-trade-proposal.service';
import { CancelPurchaseIntentService } from './application/cancel-purchase-intent.service';
import { CancelTradeProposalService } from './application/cancel-trade-proposal.service';
import { CreatePurchaseIntentService } from './application/create-purchase-intent.service';
import { CreateTradeProposalService } from './application/create-trade-proposal.service';
import { IncomingInteractionsQueryService } from './application/incoming-interactions-query.service';
import { InteractionConflictResolutionService } from './application/interaction-conflict-resolution.service';
import { InteractionResponseFactory } from './application/interaction-response.factory';
import { RejectPurchaseIntentService } from './application/reject-purchase-intent.service';
import { RejectTradeProposalService } from './application/reject-trade-proposal.service';
import { ProposedListingCommitmentEntity } from './domain/proposed-listing-commitment.entity';
import { PurchaseIntentEntity } from './domain/purchase-intent.entity';
import { TradeProposalEntity } from './domain/trade-proposal.entity';
import { TradeProposalItemEntity } from './domain/trade-proposal-item.entity';
import { IncomingInteractionsReadRepository } from './infrastructure/incoming-interactions-read.repository';
import { ProposedListingCommitmentRepository } from './infrastructure/proposed-listing-commitment.repository';
import { PurchaseIntentRepository } from './infrastructure/purchase-intent.repository';
import { TradeProposalItemRepository } from './infrastructure/trade-proposal-item.repository';
import { TradeProposalRepository } from './infrastructure/trade-proposal.repository';
import { InteractionsController } from './presentation/interactions.controller';
import { IncomingInteractionItemBuilder } from './read-models/incoming-interaction-item.builder';

@Module({
  imports: [
    AuthModule,
    MatchesModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      UserEntity,
      PublicProfileEntity,
      ReputationProfileEntity,
      GarmentEntity,
      ListingEntity,
      ListingPhotoEntity,
      PurchaseIntentEntity,
      TradeProposalEntity,
      TradeProposalItemEntity,
      ProposedListingCommitmentEntity,
    ]),
  ],
  controllers: [InteractionsController],
  providers: [
    ListingRepository,
    PurchaseIntentRepository,
    TradeProposalRepository,
    TradeProposalItemRepository,
    ProposedListingCommitmentRepository,
    IncomingInteractionsReadRepository,
    IncomingInteractionItemBuilder,
    InteractionResponseFactory,
    InteractionConflictResolutionService,
    CreatePurchaseIntentService,
    CancelPurchaseIntentService,
    AcceptPurchaseIntentService,
    RejectPurchaseIntentService,
    CreateTradeProposalService,
    CancelTradeProposalService,
    AcceptTradeProposalService,
    RejectTradeProposalService,
    IncomingInteractionsQueryService,
  ],
})
export class InteractionsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/domain/user.entity';
import { GarmentEntity } from '../listings/domain/garment.entity';
import { ListingEntity } from '../listings/domain/listing.entity';
import { ListingPhotoEntity } from '../listings/domain/listing-photo.entity';
import { ListingRepository } from '../listings/infrastructure/listing.repository';
import { PublicProfileEntity } from '../profiles/domain/public-profile.entity';
import { ProposedListingCommitmentEntity } from '../interactions/domain/proposed-listing-commitment.entity';
import { PurchaseIntentEntity } from '../interactions/domain/purchase-intent.entity';
import { TradeProposalEntity } from '../interactions/domain/trade-proposal.entity';
import { PurchaseIntentRepository } from '../interactions/infrastructure/purchase-intent.repository';
import { ProposedListingCommitmentRepository } from '../interactions/infrastructure/proposed-listing-commitment.repository';
import { TradeProposalRepository } from '../interactions/infrastructure/trade-proposal.repository';
import { ConversationMessageEntity } from './domain/conversation-message.entity';
import { ConversationThreadEntity } from './domain/conversation-thread.entity';
import { MatchSessionEntity } from './domain/match-session.entity';
import { MatchBootstrapService } from './application/match-bootstrap.service';
import { MatchCommandService } from './application/match-command.service';
import { MatchQueryService } from './application/match-query.service';
import { SystemIntegrityAuditService } from './application/system-integrity-audit.service';
import { ConversationMessageRepository } from './infrastructure/conversation-message.repository';
import { ConversationThreadRepository } from './infrastructure/conversation-thread.repository';
import { MatchReadRepository } from './infrastructure/match-read.repository';
import { MatchSessionRepository } from './infrastructure/match-session.repository';
import { ConversationsController } from './presentation/conversations.controller';
import { MatchesController } from './presentation/matches.controller';
import { MatchSurfaceBuilder } from './read-models/match-surface.builder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PublicProfileEntity,
      GarmentEntity,
      ListingEntity,
      ListingPhotoEntity,
      PurchaseIntentEntity,
      TradeProposalEntity,
      ProposedListingCommitmentEntity,
      MatchSessionEntity,
      ConversationThreadEntity,
      ConversationMessageEntity,
    ]),
  ],
  controllers: [MatchesController, ConversationsController],
  providers: [
    ListingRepository,
    PurchaseIntentRepository,
    TradeProposalRepository,
    ProposedListingCommitmentRepository,
    MatchSessionRepository,
    ConversationThreadRepository,
    ConversationMessageRepository,
    MatchReadRepository,
    MatchSurfaceBuilder,
    MatchBootstrapService,
    MatchQueryService,
    MatchCommandService,
    SystemIntegrityAuditService,
  ],
  exports: [
    MatchBootstrapService,
    MatchSessionRepository,
    ConversationThreadRepository,
    MatchQueryService,
    MatchCommandService,
    SystemIntegrityAuditService,
  ],
})
export class MatchesModule {}

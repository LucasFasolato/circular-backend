import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
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
import { AcceptPurchaseIntentService } from '../application/accept-purchase-intent.service';
import { AcceptTradeProposalService } from '../application/accept-trade-proposal.service';
import { CancelPurchaseIntentService } from '../application/cancel-purchase-intent.service';
import { CancelTradeProposalService } from '../application/cancel-trade-proposal.service';
import { CreatePurchaseIntentService } from '../application/create-purchase-intent.service';
import { CreateTradeProposalService } from '../application/create-trade-proposal.service';
import { IncomingInteractionsQueryService } from '../application/incoming-interactions-query.service';
import { RejectPurchaseIntentService } from '../application/reject-purchase-intent.service';
import { RejectTradeProposalService } from '../application/reject-trade-proposal.service';
import { CreatePurchaseIntentDto } from './dto/create-purchase-intent.dto';
import { CreateTradeProposalDto } from './dto/create-trade-proposal.dto';
import { IncomingInteractionsResponseDto } from './dto/incoming-interactions-response.dto';
import {
  InteractionResolutionResponseDto,
  PurchaseIntentMutationResponseDto,
  TradeProposalMutationResponseDto,
} from './dto/interaction-response.dto';
import { ListIncomingInteractionsQueryDto } from './dto/list-incoming-interactions-query.dto';

@ApiTags('Interactions')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class InteractionsController {
  constructor(
    private readonly createPurchaseIntentService: CreatePurchaseIntentService,
    private readonly cancelPurchaseIntentService: CancelPurchaseIntentService,
    private readonly acceptPurchaseIntentService: AcceptPurchaseIntentService,
    private readonly rejectPurchaseIntentService: RejectPurchaseIntentService,
    private readonly createTradeProposalService: CreateTradeProposalService,
    private readonly cancelTradeProposalService: CancelTradeProposalService,
    private readonly acceptTradeProposalService: AcceptTradeProposalService,
    private readonly rejectTradeProposalService: RejectTradeProposalService,
    private readonly incomingInteractionsQueryService: IncomingInteractionsQueryService,
  ) {}

  @Post('listings/:listingId/purchase-intents')
  @ApiOperation({ summary: 'Create a purchase intent for a published listing' })
  @ApiResponse({ status: 201, type: PurchaseIntentMutationResponseDto })
  async createPurchaseIntent(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
    @Body() dto: CreatePurchaseIntentDto,
  ): Promise<PurchaseIntentMutationResponseDto> {
    return this.createPurchaseIntentService.execute(user.id, listingId, dto);
  }

  @Delete('purchase-intents/:purchaseIntentId')
  @ApiOperation({ summary: 'Cancel an active purchase intent' })
  @ApiResponse({ status: 200, type: PurchaseIntentMutationResponseDto })
  async cancelPurchaseIntent(
    @CurrentUser() user: RequestUser,
    @Param('purchaseIntentId', new ParseUUIDPipe()) purchaseIntentId: string,
  ): Promise<PurchaseIntentMutationResponseDto> {
    return this.cancelPurchaseIntentService.execute(user.id, purchaseIntentId);
  }

  @Post('purchase-intents/:purchaseIntentId/accept')
  @ApiOperation({
    summary: 'Accept a purchase intent and open a match session',
  })
  @ApiResponse({ status: 200, type: InteractionResolutionResponseDto })
  async acceptPurchaseIntent(
    @CurrentUser() user: RequestUser,
    @Param('purchaseIntentId', new ParseUUIDPipe()) purchaseIntentId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.acceptPurchaseIntentService.execute(user.id, purchaseIntentId);
  }

  @Post('purchase-intents/:purchaseIntentId/reject')
  @ApiOperation({ summary: 'Reject a purchase intent' })
  @ApiResponse({ status: 200, type: InteractionResolutionResponseDto })
  async rejectPurchaseIntent(
    @CurrentUser() user: RequestUser,
    @Param('purchaseIntentId', new ParseUUIDPipe()) purchaseIntentId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.rejectPurchaseIntentService.execute(user.id, purchaseIntentId);
  }

  @Post('listings/:listingId/trade-proposals')
  @ApiOperation({ summary: 'Create a trade proposal for a published listing' })
  @ApiResponse({ status: 201, type: TradeProposalMutationResponseDto })
  async createTradeProposal(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
    @Body() dto: CreateTradeProposalDto,
  ): Promise<TradeProposalMutationResponseDto> {
    return this.createTradeProposalService.execute(user.id, listingId, dto);
  }

  @Delete('trade-proposals/:tradeProposalId')
  @ApiOperation({ summary: 'Cancel an active trade proposal' })
  @ApiResponse({ status: 200, type: TradeProposalMutationResponseDto })
  async cancelTradeProposal(
    @CurrentUser() user: RequestUser,
    @Param('tradeProposalId', new ParseUUIDPipe()) tradeProposalId: string,
  ): Promise<TradeProposalMutationResponseDto> {
    return this.cancelTradeProposalService.execute(user.id, tradeProposalId);
  }

  @Post('trade-proposals/:tradeProposalId/accept')
  @ApiOperation({ summary: 'Accept a trade proposal and open a match session' })
  @ApiResponse({ status: 200, type: InteractionResolutionResponseDto })
  async acceptTradeProposal(
    @CurrentUser() user: RequestUser,
    @Param('tradeProposalId', new ParseUUIDPipe()) tradeProposalId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.acceptTradeProposalService.execute(user.id, tradeProposalId);
  }

  @Post('trade-proposals/:tradeProposalId/reject')
  @ApiOperation({ summary: 'Reject a trade proposal' })
  @ApiResponse({ status: 200, type: InteractionResolutionResponseDto })
  async rejectTradeProposal(
    @CurrentUser() user: RequestUser,
    @Param('tradeProposalId', new ParseUUIDPipe()) tradeProposalId: string,
  ): Promise<InteractionResolutionResponseDto> {
    return this.rejectTradeProposalService.execute(user.id, tradeProposalId);
  }

  @Get('interactions/incoming')
  @ApiOperation({
    summary:
      'List incoming interactions for listings owned by the current user',
  })
  @ApiResponse({ status: 200, type: IncomingInteractionsResponseDto })
  async getIncoming(
    @CurrentUser() user: RequestUser,
    @Query() query: ListIncomingInteractionsQueryDto,
  ) {
    return this.incomingInteractionsQueryService.execute(user.id, query);
  }
}

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { ModerationQueryService } from '../application/moderation-query.service';
import {
  ListingModerationDetailResponseDto,
  ObservedListingsResponseDto,
} from './dto/moderation-response.dto';

@ApiTags('Moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller()
export class ModerationController {
  constructor(
    private readonly moderationQueryService: ModerationQueryService,
  ) {}

  @Get('listings/:listingId/moderation')
  @ApiOperation({ summary: 'Get structured moderation detail for a listing' })
  @ApiResponse({ status: 200, type: ListingModerationDetailResponseDto })
  async getListingModeration(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<ListingModerationDetailResponseDto> {
    return this.moderationQueryService.getListingModeration(user.id, listingId);
  }

  @Get('moderation/me/observed-listings')
  @ApiOperation({ summary: 'List current user observed listings' })
  @ApiResponse({ status: 200, type: ObservedListingsResponseDto })
  async getObservedListings(
    @CurrentUser() user: RequestUser,
  ): Promise<ObservedListingsResponseDto> {
    return this.moderationQueryService.getObservedListings(user.id);
  }
}

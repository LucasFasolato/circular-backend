import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
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
import { DiscoveryFeedQueryService } from '../application/discovery-feed-query.service';
import { FeedDismissalService } from '../application/feed-dismissal.service';
import { DismissFeedItemResponseDto } from './dto/dismiss-feed-item.response.dto';
import { DiscoveryFeedResponseDto } from './dto/discovery-feed.response.dto';
import { GetDiscoveryFeedQueryDto } from './dto/get-discovery-feed-query.dto';

@ApiTags('Discovery')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class FeedController {
  constructor(
    private readonly discoveryFeedQueryService: DiscoveryFeedQueryService,
    private readonly feedDismissalService: FeedDismissalService,
  ) {}

  @Get('swipe')
  @ApiOperation({ summary: 'Get the swipe discovery feed' })
  @ApiResponse({ status: 200, type: DiscoveryFeedResponseDto })
  async getSwipeFeed(
    @CurrentUser() user: RequestUser,
    @Query() query: GetDiscoveryFeedQueryDto,
  ) {
    return this.discoveryFeedQueryService.getSwipeFeed(user.id, query);
  }

  @Post(':listingId/dismiss')
  @ApiOperation({ summary: 'Dismiss a feed candidate for the current user' })
  @ApiResponse({ status: 200, type: DismissFeedItemResponseDto })
  async dismiss(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<DismissFeedItemResponseDto> {
    return this.feedDismissalService.dismiss(user.id, listingId);
  }
}

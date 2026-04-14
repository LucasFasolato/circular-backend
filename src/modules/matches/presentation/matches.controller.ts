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
import { MatchCommandService } from '../application/match-command.service';
import { MatchQueryService } from '../application/match-query.service';
import { ListMyMatchesQueryDto } from './dto/list-my-matches-query.dto';
import {
  MatchDetailResponseDto,
  MatchMutationResponseDto,
  MyMatchesResponseDto,
} from './dto/match-response.dto';

@ApiTags('Matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MatchesController {
  constructor(
    private readonly matchQueryService: MatchQueryService,
    private readonly matchCommandService: MatchCommandService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'List current user match sessions' })
  @ApiResponse({ status: 200, type: MyMatchesResponseDto })
  async getMine(
    @CurrentUser() user: RequestUser,
    @Query() query: ListMyMatchesQueryDto,
  ) {
    return this.matchQueryService.getMine(user.id, query);
  }

  @Get(':matchSessionId')
  @ApiOperation({ summary: 'Get match coordination surface' })
  @ApiResponse({ status: 200, type: MatchDetailResponseDto })
  async getById(
    @CurrentUser() user: RequestUser,
    @Param('matchSessionId', new ParseUUIDPipe()) matchSessionId: string,
  ): Promise<MatchDetailResponseDto> {
    return this.matchQueryService.getById(user.id, matchSessionId);
  }

  @Post(':matchSessionId/confirm-success')
  @ApiOperation({ summary: 'Confirm a successful match outcome' })
  @ApiResponse({ status: 200, type: MatchMutationResponseDto })
  async confirmSuccess(
    @CurrentUser() user: RequestUser,
    @Param('matchSessionId', new ParseUUIDPipe()) matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    return this.matchCommandService.confirmSuccess(user.id, matchSessionId);
  }

  @Post(':matchSessionId/mark-failed')
  @ApiOperation({ summary: 'Mark a match as failed' })
  @ApiResponse({ status: 200, type: MatchMutationResponseDto })
  async markFailed(
    @CurrentUser() user: RequestUser,
    @Param('matchSessionId', new ParseUUIDPipe()) matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    return this.matchCommandService.markFailed(user.id, matchSessionId);
  }

  @Post(':matchSessionId/cancel')
  @ApiOperation({ summary: 'Cancel an active match' })
  @ApiResponse({ status: 200, type: MatchMutationResponseDto })
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('matchSessionId', new ParseUUIDPipe()) matchSessionId: string,
  ): Promise<MatchMutationResponseDto> {
    return this.matchCommandService.cancel(user.id, matchSessionId);
  }
}

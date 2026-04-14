import {
  Controller,
  Delete,
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
import { SavedListingsService } from '../application/saved-listings.service';
import {
  SavedListingsResponseDto,
  SaveListingStateResponseDto,
} from './dto/discovery-feed.response.dto';
import { GetSavedListingsQueryDto } from './dto/get-saved-listings-query.dto';

@ApiTags('Discovery')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SavedListingsController {
  constructor(private readonly savedListingsService: SavedListingsService) {}

  @Get('saved-listings/me')
  @ApiOperation({ summary: 'Get saved listings for the current user' })
  @ApiResponse({ status: 200, type: SavedListingsResponseDto })
  async getMine(
    @CurrentUser() user: RequestUser,
    @Query() query: GetSavedListingsQueryDto,
  ) {
    return this.savedListingsService.getMine(user.id, query);
  }

  @Post('listings/:listingId/save')
  @ApiOperation({ summary: 'Save a listing for the current user' })
  @ApiResponse({ status: 200, type: SaveListingStateResponseDto })
  async save(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<SaveListingStateResponseDto> {
    return this.savedListingsService.save(user.id, listingId);
  }

  @Delete('listings/:listingId/save')
  @ApiOperation({ summary: 'Remove a listing from the current user saved set' })
  @ApiResponse({ status: 200, type: SaveListingStateResponseDto })
  async unsave(
    @CurrentUser() user: RequestUser,
    @Param('listingId', new ParseUUIDPipe()) listingId: string,
  ): Promise<SaveListingStateResponseDto> {
    return this.savedListingsService.unsave(user.id, listingId);
  }
}

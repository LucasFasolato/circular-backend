import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../shared/current-user.decorator';
import { RequestUser } from '../../../shared/request-user.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { ListingQueryService } from '../application/listing-query.service';
import { ListingsCommandService } from '../application/listings-command.service';
import { LISTING_LIMITS } from '../domain/listing-limits.constants';
import { UploadedPhotoFile } from '../infrastructure/local-listing-photo-storage.service';
import { OptionalJwtAuthGuard } from '../infrastructure/optional-jwt-auth.guard';
import { AddListingPhotosRequestDto } from './dto/add-listing-photos-request.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListMyListingsQueryDto } from './dto/list-my-listings-query.dto';
import {
  ListingDetailResponseDto,
  MyListingsResponseDto,
} from './dto/listing-response.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsCommandService: ListingsCommandService,
    private readonly listingQueryService: ListingQueryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new draft listing' })
  @ApiResponse({ status: 201, type: ListingDetailResponseDto })
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateListingDto,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.createDraft(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List current user listings' })
  @ApiResponse({ status: 200, type: MyListingsResponseDto })
  async getMine(
    @CurrentUser() user: RequestUser,
    @Query() query: ListMyListingsQueryDto,
  ): Promise<MyListingsResponseDto> {
    return this.listingQueryService.getMine(user.id, query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get listing detail surface' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user?: RequestUser,
  ): Promise<ListingDetailResponseDto> {
    return this.listingQueryService.getById(id, user?.id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', LISTING_LIMITS.MAX_PHOTOS_PER_LISTING),
  )
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AddListingPhotosRequestDto })
  @ApiOperation({ summary: 'Add photos to a listing' })
  @ApiResponse({ status: 201, type: ListingDetailResponseDto })
  async addPhotos(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFiles() files: UploadedPhotoFile[],
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.addPhotos(user.id, id, files ?? []);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update an editable listing' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateListingDto,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.update(user.id, id, dto);
  }

  @Post(':id/submit-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a listing for review' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async submitReview(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.submitReview(user.id, id);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Pause a published listing' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async pause(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.pause(user.id, id);
  }

  @Post(':id/resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Resume a paused listing' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async resume(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.resume(user.id, id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive a listing' })
  @ApiResponse({ status: 200, type: ListingDetailResponseDto })
  async archive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ListingDetailResponseDto> {
    return this.listingsCommandService.archive(user.id, id);
  }
}

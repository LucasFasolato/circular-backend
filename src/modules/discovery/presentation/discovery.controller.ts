import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { DiscoveryCategoriesQueryService } from '../application/discovery-categories-query.service';
import { DiscoveryCategoriesResponseDto } from './dto/discovery-categories.response.dto';

@ApiTags('Discovery')
@Controller('discovery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DiscoveryController {
  constructor(
    private readonly discoveryCategoriesQueryService: DiscoveryCategoriesQueryService,
  ) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get official discovery categories and filters' })
  @ApiResponse({ status: 200, type: DiscoveryCategoriesResponseDto })
  getCategories(): DiscoveryCategoriesResponseDto {
    return this.discoveryCategoriesQueryService.getCatalog();
  }
}

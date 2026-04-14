import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LISTING_LIMITS } from '../../../listings/domain/listing-limits.constants';
import { ListingCategory } from '../../../listings/domain/listing-category.enum';
import { GarmentSize } from '../../../listings/domain/garment-size.enum';
import { DiscoveryFeedMode } from '../../domain/discovery-feed-mode.enum';

export class GetDiscoveryFeedQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: LISTING_LIMITS.MAX_LIST_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LISTING_LIMITS.MAX_LIST_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @ApiPropertyOptional({ enum: GarmentSize })
  @IsOptional()
  @IsEnum(GarmentSize)
  size?: GarmentSize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({ enum: DiscoveryFeedMode })
  @IsOptional()
  @IsEnum(DiscoveryFeedMode)
  mode?: DiscoveryFeedMode;
}

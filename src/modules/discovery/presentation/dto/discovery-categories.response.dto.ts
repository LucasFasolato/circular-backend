import { ApiProperty } from '@nestjs/swagger';
import { GarmentSize } from '../../../listings/domain/garment-size.enum';
import { ListingCategory } from '../../../listings/domain/listing-category.enum';
import { DiscoveryFeedMode } from '../../domain/discovery-feed-mode.enum';

export class DiscoveryCategoryGroupResponseDto {
  @ApiProperty({ enum: ListingCategory })
  code: ListingCategory;

  @ApiProperty({ type: [String] })
  subcategories: string[];

  @ApiProperty({ enum: GarmentSize, isArray: true })
  sizes: GarmentSize[];
}

export class DiscoveryCategoriesResponseDto {
  @ApiProperty({ type: [DiscoveryCategoryGroupResponseDto] })
  categories: DiscoveryCategoryGroupResponseDto[];

  @ApiProperty({ enum: GarmentSize, isArray: true })
  sizes: GarmentSize[];

  @ApiProperty({ enum: DiscoveryFeedMode, isArray: true })
  modes: DiscoveryFeedMode[];
}

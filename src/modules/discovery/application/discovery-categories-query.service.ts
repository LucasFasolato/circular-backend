import { Injectable } from '@nestjs/common';
import { GarmentSize } from '../../listings/domain/garment-size.enum';
import {
  ListingCategory,
  LISTING_SUBCATEGORIES,
} from '../../listings/domain/listing-category.enum';
import { getAvailableSizesForCategory } from '../../listings/domain/listing-catalog.policy';
import { DiscoveryFeedMode } from '../domain/discovery-feed-mode.enum';
import { DiscoveryCategoriesResponseDto } from '../presentation/dto/discovery-categories.response.dto';

@Injectable()
export class DiscoveryCategoriesQueryService {
  getCatalog(): DiscoveryCategoriesResponseDto {
    return {
      categories: Object.values(ListingCategory).map((category) => ({
        code: category,
        subcategories: LISTING_SUBCATEGORIES[category],
        sizes: getAvailableSizesForCategory(category),
      })),
      sizes: Object.values(GarmentSize),
      modes: Object.values(DiscoveryFeedMode),
    };
  }
}

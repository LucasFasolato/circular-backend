import { DiscoveryCategoriesQueryService } from './discovery-categories-query.service';
import {
  ListingCategory,
  LISTING_SUBCATEGORIES,
} from '../../listings/domain/listing-category.enum';
import { GarmentSize } from '../../listings/domain/garment-size.enum';
import { DiscoveryFeedMode } from '../domain/discovery-feed-mode.enum';

describe('DiscoveryCategoriesQueryService', () => {
  it('returns the official centralized discovery catalog', () => {
    const service = new DiscoveryCategoriesQueryService();

    const result = service.getCatalog();

    expect(result.categories).toHaveLength(
      Object.values(ListingCategory).length,
    );
    expect(result.categories).toContainEqual({
      code: ListingCategory.TOPS,
      subcategories: LISTING_SUBCATEGORIES[ListingCategory.TOPS],
      sizes: [
        GarmentSize.XXS,
        GarmentSize.XS,
        GarmentSize.S,
        GarmentSize.M,
        GarmentSize.L,
        GarmentSize.XL,
        GarmentSize.XXL,
        GarmentSize.XXXL,
      ],
    });
    expect(result.sizes).toEqual(Object.values(GarmentSize));
    expect(result.modes).toEqual(Object.values(DiscoveryFeedMode));
  });
});

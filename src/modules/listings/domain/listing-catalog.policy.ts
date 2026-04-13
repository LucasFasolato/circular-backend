import { GarmentCondition } from './garment-condition.enum';
import { GarmentSize } from './garment-size.enum';
import {
  ListingCategory,
  LISTING_SUBCATEGORIES,
} from './listing-category.enum';

const CLOTHING_SIZES = new Set<GarmentSize>([
  GarmentSize.XXS,
  GarmentSize.XS,
  GarmentSize.S,
  GarmentSize.M,
  GarmentSize.L,
  GarmentSize.XL,
  GarmentSize.XXL,
  GarmentSize.XXXL,
]);

const FOOTWEAR_SIZES = new Set<GarmentSize>([
  GarmentSize.SIZE_34,
  GarmentSize.SIZE_35,
  GarmentSize.SIZE_36,
  GarmentSize.SIZE_37,
  GarmentSize.SIZE_38,
  GarmentSize.SIZE_39,
  GarmentSize.SIZE_40,
  GarmentSize.SIZE_41,
  GarmentSize.SIZE_42,
  GarmentSize.SIZE_43,
  GarmentSize.SIZE_44,
  GarmentSize.SIZE_45,
]);

const ONE_SIZE_CATEGORIES = new Set<ListingCategory>([
  ListingCategory.BAGS,
  ListingCategory.ACCESSORIES,
]);

const CLOTHING_CATEGORIES = new Set<ListingCategory>([
  ListingCategory.TOPS,
  ListingCategory.BOTTOMS,
  ListingCategory.OUTERWEAR,
  ListingCategory.DRESSES_AND_ONE_PIECE,
]);

export function isValidGarmentCondition(
  value: string,
): value is GarmentCondition {
  return Object.values(GarmentCondition).includes(value as GarmentCondition);
}

export function isValidListingCategory(
  value: string,
): value is ListingCategory {
  return Object.values(ListingCategory).includes(value as ListingCategory);
}

export function isValidGarmentSize(value: string): value is GarmentSize {
  return Object.values(GarmentSize).includes(value as GarmentSize);
}

export function isValidSubcategory(
  category: ListingCategory,
  subcategory: string | null,
): boolean {
  if (subcategory === null) {
    return true;
  }

  return LISTING_SUBCATEGORIES[category].includes(subcategory);
}

export function isValidSizeForCategory(
  category: ListingCategory,
  size: GarmentSize,
): boolean {
  if (category === ListingCategory.FOOTWEAR) {
    return FOOTWEAR_SIZES.has(size);
  }

  if (ONE_SIZE_CATEGORIES.has(category)) {
    return size === GarmentSize.ONE_SIZE;
  }

  if (CLOTHING_CATEGORIES.has(category)) {
    return CLOTHING_SIZES.has(size);
  }

  return false;
}

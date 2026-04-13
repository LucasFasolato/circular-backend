export enum ListingCategory {
  TOPS = 'TOPS',
  BOTTOMS = 'BOTTOMS',
  OUTERWEAR = 'OUTERWEAR',
  DRESSES_AND_ONE_PIECE = 'DRESSES_AND_ONE_PIECE',
  FOOTWEAR = 'FOOTWEAR',
  BAGS = 'BAGS',
  ACCESSORIES = 'ACCESSORIES',
}

export const LISTING_SUBCATEGORIES: Record<ListingCategory, string[]> = {
  [ListingCategory.TOPS]: [
    'TSHIRT',
    'SHIRT',
    'BLOUSE',
    'HOODIE',
    'SWEATER',
    'TOP',
    'POLO',
  ],
  [ListingCategory.BOTTOMS]: ['JEANS', 'PANTS', 'SHORTS', 'SKIRT', 'LEGGINGS'],
  [ListingCategory.OUTERWEAR]: ['JACKET', 'COAT', 'BLAZER', 'VEST'],
  [ListingCategory.DRESSES_AND_ONE_PIECE]: ['DRESS', 'JUMPSUIT'],
  [ListingCategory.FOOTWEAR]: [
    'SNEAKERS',
    'BOOTS',
    'SANDALS',
    'HEELS',
    'FLATS',
    'LOAFERS',
  ],
  [ListingCategory.BAGS]: [
    'HANDBAG',
    'BACKPACK',
    'TOTE',
    'SHOULDER_BAG',
    'WALLET',
  ],
  [ListingCategory.ACCESSORIES]: [
    'BELT',
    'HAT',
    'SCARF',
    'JEWELRY',
    'SUNGLASSES',
    'WATCH',
  ],
};

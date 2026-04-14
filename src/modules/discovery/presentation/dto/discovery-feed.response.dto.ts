import { ApiProperty } from '@nestjs/swagger';
import { GarmentSize } from '../../../listings/domain/garment-size.enum';
import { ListingCategory } from '../../../listings/domain/listing-category.enum';
import { ListingState } from '../../../listings/domain/listing-state.enum';
import { DiscoveryBadge } from '../../domain/discovery-badge.enum';

export class DiscoveryItemLocationResponseDto {
  @ApiProperty()
  city: string;

  @ApiProperty({ nullable: true })
  zone: string | null;
}

export class DiscoveryItemViewerContextResponseDto {
  @ApiProperty()
  isOwner: boolean;

  @ApiProperty()
  isSaved: boolean;
}

export class DiscoveryItemAvailableActionsResponseDto {
  @ApiProperty()
  canBuy: boolean;

  @ApiProperty()
  canTrade: boolean;

  @ApiProperty()
  canSave: boolean;

  @ApiProperty()
  canUnsave: boolean;

  @ApiProperty()
  canDismiss: boolean;
}

export class DiscoveryFeedItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ListingState })
  state: ListingState;

  @ApiProperty({ nullable: true })
  photo: string | null;

  @ApiProperty({ enum: ListingCategory })
  category: ListingCategory;

  @ApiProperty({ nullable: true })
  subcategory: string | null;

  @ApiProperty({ enum: GarmentSize })
  size: GarmentSize;

  @ApiProperty({ nullable: true })
  qualityScore: number | null;

  @ApiProperty({ type: [String] })
  qualityLabels: string[];

  @ApiProperty({ enum: DiscoveryBadge, isArray: true })
  badges: DiscoveryBadge[];

  @ApiProperty({ type: DiscoveryItemLocationResponseDto })
  location: DiscoveryItemLocationResponseDto;

  @ApiProperty({ nullable: true })
  price: number | null;

  @ApiProperty({ type: DiscoveryItemViewerContextResponseDto })
  viewerContext: DiscoveryItemViewerContextResponseDto;

  @ApiProperty({ type: DiscoveryItemAvailableActionsResponseDto })
  availableActions: DiscoveryItemAvailableActionsResponseDto;
}

export class SavedListingItemDto extends DiscoveryFeedItemDto {
  @ApiProperty()
  savedAt: string;
}

export class DiscoveryFeedResponseDto {
  @ApiProperty({ type: [DiscoveryFeedItemDto] })
  items: DiscoveryFeedItemDto[];
}

export class SavedListingsResponseDto {
  @ApiProperty({ type: [SavedListingItemDto] })
  items: SavedListingItemDto[];
}

export class SaveListingStateResponseDto {
  @ApiProperty()
  listingId: string;

  @ApiProperty({ enum: ListingState })
  state: ListingState;

  @ApiProperty()
  saved: boolean;

  @ApiProperty({ type: DiscoveryItemViewerContextResponseDto })
  viewerContext: DiscoveryItemViewerContextResponseDto;

  @ApiProperty({ type: DiscoveryItemAvailableActionsResponseDto })
  availableActions: DiscoveryItemAvailableActionsResponseDto;
}

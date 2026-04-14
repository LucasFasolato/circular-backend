import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode } from '../../domain/currency-code.enum';
import { GarmentCondition } from '../../domain/garment-condition.enum';
import { GarmentSize } from '../../domain/garment-size.enum';
import { ImageAuditStatus } from '../../domain/image-audit-status.enum';
import { ListingCategory } from '../../domain/listing-category.enum';
import { ListingState } from '../../domain/listing-state.enum';

export class ListingPhotoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ enum: ImageAuditStatus })
  auditStatus: ImageAuditStatus;
}

export class ListingOwnerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty({ nullable: true })
  instagramHandle: string | null;
}

export class ListingGarmentResponseDto {
  @ApiProperty({ enum: ListingCategory })
  category: ListingCategory;

  @ApiProperty({ nullable: true })
  subcategory: string | null;

  @ApiProperty({ enum: GarmentSize })
  size: GarmentSize;

  @ApiProperty({ enum: GarmentCondition })
  condition: GarmentCondition;

  @ApiProperty({ nullable: true })
  brand: string | null;

  @ApiProperty({ nullable: true })
  color: string | null;

  @ApiProperty({ nullable: true })
  material: string | null;
}

export class ListingTradePreferencesResponseDto {
  @ApiProperty({ enum: ListingCategory, isArray: true })
  desiredCategories: ListingCategory[];

  @ApiProperty({ enum: GarmentSize, isArray: true })
  desiredSizes: GarmentSize[];

  @ApiProperty({ nullable: true })
  notes: string | null;
}

export class ListingCommercialConfigResponseDto {
  @ApiProperty()
  allowsPurchase: boolean;

  @ApiProperty()
  allowsTrade: boolean;

  @ApiProperty({ nullable: true })
  price: number | null;

  @ApiProperty({ enum: CurrencyCode })
  currencyCode: CurrencyCode;

  @ApiProperty({ type: ListingTradePreferencesResponseDto, nullable: true })
  tradePreferences: ListingTradePreferencesResponseDto | null;
}

export class ListingLocationResponseDto {
  @ApiProperty()
  city: string;

  @ApiProperty({ nullable: true })
  zone: string | null;
}

export class ListingPayloadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ListingState })
  state: ListingState;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  qualityScore: number | null;

  @ApiProperty({ type: [String] })
  qualityLabels: string[];

  @ApiProperty({ type: ListingGarmentResponseDto })
  garment: ListingGarmentResponseDto;

  @ApiProperty({ type: ListingCommercialConfigResponseDto })
  commercialConfig: ListingCommercialConfigResponseDto;

  @ApiProperty({ type: ListingLocationResponseDto })
  location: ListingLocationResponseDto;

  @ApiProperty({ type: [ListingPhotoResponseDto] })
  photos: ListingPhotoResponseDto[];

  @ApiProperty({ type: ListingOwnerResponseDto })
  owner: ListingOwnerResponseDto;

  @ApiProperty({ nullable: true })
  publishedAt: string | null;

  @ApiProperty({ nullable: true })
  reservationExpiresAt: string | null;

  @ApiProperty({ nullable: true })
  archivedAt: string | null;
}

export class ListingViewerContextResponseDto {
  @ApiProperty()
  isOwner: boolean;

  @ApiProperty()
  isSaved: boolean;

  @ApiProperty()
  hasActivePurchaseIntent: boolean;

  @ApiProperty()
  hasActiveTradeProposal: boolean;
}

export class ListingAvailableActionsResponseDto {
  @ApiProperty()
  canUploadPhotos: boolean;

  @ApiProperty()
  canSubmitForReview: boolean;

  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canArchive: boolean;

  @ApiProperty()
  canPause: boolean;

  @ApiProperty()
  canResume: boolean;

  @ApiProperty()
  canBuy: boolean;

  @ApiProperty()
  canTrade: boolean;

  @ApiProperty()
  canSave: boolean;

  @ApiProperty()
  canUnsave: boolean;

  @ApiProperty()
  canRenewReservation: boolean;
}

export class ListingDetailResponseDto {
  @ApiProperty({ type: ListingPayloadResponseDto })
  listing: ListingPayloadResponseDto;

  @ApiProperty({ type: ListingViewerContextResponseDto })
  viewerContext: ListingViewerContextResponseDto;

  @ApiProperty({ type: ListingAvailableActionsResponseDto })
  availableActions: ListingAvailableActionsResponseDto;
}

export class MyListingsResponseDto {
  @ApiProperty({ type: [ListingDetailResponseDto] })
  items: ListingDetailResponseDto[];
}

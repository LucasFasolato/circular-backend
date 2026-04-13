import { ApiProperty } from '@nestjs/swagger';
import { ImageAuditStatus } from '../../../listings/domain/image-audit-status.enum';
import { ListingState } from '../../../listings/domain/listing-state.enum';
import { ModerationReasonCode } from '../../domain/moderation-reason-code.enum';
import { ModerationReviewState } from '../../domain/moderation-review-state.enum';

export class ModerationReasonDto {
  @ApiProperty({ enum: ModerationReasonCode })
  code: ModerationReasonCode;

  @ApiProperty()
  message: string;
}

export class ModerationImageAuditDto {
  @ApiProperty()
  photoId: string;

  @ApiProperty({ enum: ImageAuditStatus })
  status: ImageAuditStatus;

  @ApiProperty({ type: [ModerationReasonDto] })
  reasons: ModerationReasonDto[];
}

class ModerationAvailableActionsDto {
  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canResubmit: boolean;
}

class ModerationSummaryDto {
  @ApiProperty({ enum: ModerationReviewState })
  status: ModerationReviewState;

  @ApiProperty({ type: [ModerationReasonDto] })
  reasons: ModerationReasonDto[];

  @ApiProperty()
  reviewVersion: number;

  @ApiProperty({ nullable: true })
  resolvedAt: string | null;

  @ApiProperty({ type: [ModerationImageAuditDto] })
  imageAudits: ModerationImageAuditDto[];
}

export class ListingModerationDetailResponseDto {
  @ApiProperty()
  listingId: string;

  @ApiProperty({ enum: ListingState })
  listingState: ListingState;

  @ApiProperty({ type: ModerationSummaryDto })
  moderation: ModerationSummaryDto;

  @ApiProperty({ type: ModerationAvailableActionsDto })
  availableActions: ModerationAvailableActionsDto;
}

class ObservedListingGarmentDto {
  @ApiProperty()
  category: string;

  @ApiProperty({ nullable: true })
  subcategory: string | null;

  @ApiProperty()
  size: string;

  @ApiProperty()
  condition: string;
}

class ObservedListingLocationDto {
  @ApiProperty()
  city: string;

  @ApiProperty({ nullable: true })
  zone: string | null;
}

class ObservedListingPhotoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  position: number;

  @ApiProperty({ enum: ImageAuditStatus })
  auditStatus: ImageAuditStatus;
}

class ObservedListingAvailableActionsDto {
  @ApiProperty()
  canEdit: boolean;

  @ApiProperty()
  canResubmit: boolean;
}

class ObservedListingModerationDto {
  @ApiProperty({ enum: ModerationReviewState })
  status: ModerationReviewState;

  @ApiProperty({ type: [ModerationReasonDto] })
  reasons: ModerationReasonDto[];
}

export class ObservedListingItemDto {
  @ApiProperty()
  listingId: string;

  @ApiProperty({ enum: ListingState })
  state: ListingState;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ type: ObservedListingGarmentDto })
  garment: ObservedListingGarmentDto;

  @ApiProperty({ type: ObservedListingLocationDto })
  location: ObservedListingLocationDto;

  @ApiProperty({ type: [ObservedListingPhotoDto] })
  photos: ObservedListingPhotoDto[];

  @ApiProperty({ type: ObservedListingModerationDto })
  moderation: ObservedListingModerationDto;

  @ApiProperty({ type: ObservedListingAvailableActionsDto })
  availableActions: ObservedListingAvailableActionsDto;
}

export class ObservedListingsResponseDto {
  @ApiProperty({ type: [ObservedListingItemDto] })
  items: ObservedListingItemDto[];
}

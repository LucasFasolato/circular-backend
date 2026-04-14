import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { INTERACTION_LIMITS } from '../../domain/interaction-limits.constants';

export class CreateTradeProposalDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @ArrayMinSize(INTERACTION_LIMITS.MIN_PROPOSED_ITEMS_PER_TRADE_PROPOSAL)
  @ArrayMaxSize(INTERACTION_LIMITS.MAX_PROPOSED_ITEMS_PER_TRADE_PROPOSAL)
  @IsUUID('4', { each: true })
  proposedListingIds: string[];

  @ApiPropertyOptional({ example: 'LISTING_DETAIL' })
  @IsOptional()
  @IsString()
  @MaxLength(INTERACTION_LIMITS.MAX_SOURCE_LENGTH)
  source?: string;
}

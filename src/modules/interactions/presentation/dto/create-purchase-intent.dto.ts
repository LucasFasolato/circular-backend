import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { INTERACTION_LIMITS } from '../../domain/interaction-limits.constants';

export class CreatePurchaseIntentDto {
  @ApiPropertyOptional({ example: 'LISTING_DETAIL' })
  @IsOptional()
  @IsString()
  @MaxLength(INTERACTION_LIMITS.MAX_SOURCE_LENGTH)
  source?: string;
}

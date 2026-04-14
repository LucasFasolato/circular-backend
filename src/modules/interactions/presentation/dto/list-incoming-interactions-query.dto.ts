import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LISTING_LIMITS } from '../../../listings/domain/listing-limits.constants';

export enum IncomingInteractionsTypeFilter {
  PURCHASE = 'purchase',
  TRADE = 'trade',
  ALL = 'all',
}

export class ListIncomingInteractionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: LISTING_LIMITS.MAX_LIST_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LISTING_LIMITS.MAX_LIST_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ enum: IncomingInteractionsTypeFilter })
  @IsOptional()
  @IsEnum(IncomingInteractionsTypeFilter)
  type?: IncomingInteractionsTypeFilter;
}

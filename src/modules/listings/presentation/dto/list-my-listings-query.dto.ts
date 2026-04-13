import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';
import { ListingState } from '../../domain/listing-state.enum';

export class ListMyListingsQueryDto {
  @ApiPropertyOptional({ enum: ListingState })
  @IsOptional()
  @IsEnum(ListingState)
  state?: ListingState;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: LISTING_LIMITS.DEFAULT_LIST_LIMIT })
  @Transform(({ value }) =>
    value === undefined ? undefined : Number.parseInt(String(value), 10),
  )
  @IsOptional()
  @Min(1)
  @Max(LISTING_LIMITS.MAX_LIST_LIMIT)
  limit?: number;
}

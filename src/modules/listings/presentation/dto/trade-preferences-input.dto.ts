import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GarmentSize } from '../../domain/garment-size.enum';
import { ListingCategory } from '../../domain/listing-category.enum';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class TradePreferencesInputDto {
  @ApiPropertyOptional({ enum: ListingCategory, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ListingCategory, { each: true })
  @Type(() => String)
  desiredCategories?: ListingCategory[];

  @ApiPropertyOptional({ enum: GarmentSize, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(GarmentSize, { each: true })
  @Type(() => String)
  desiredSizes?: GarmentSize[];

  @ApiPropertyOptional({
    example: 'Prefiero camperas y zapatillas urbanas.',
    nullable: true,
  })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_TRADE_PREFERENCE_NOTES_LENGTH)
  notes?: string | null;
}

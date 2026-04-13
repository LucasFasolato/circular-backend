import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class LocationInputDto {
  @ApiProperty({ example: 'Rosario' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(LISTING_LIMITS.MAX_CITY_LENGTH)
  city: string;

  @ApiPropertyOptional({ example: 'Centro', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_ZONE_LENGTH)
  zone?: string | null;
}

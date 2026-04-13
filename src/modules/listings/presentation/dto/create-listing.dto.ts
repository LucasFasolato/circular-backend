import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';
import { CommercialConfigInputDto } from './commercial-config-input.dto';
import { GarmentInputDto } from './garment-input.dto';
import { LocationInputDto } from './location-input.dto';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateListingDto {
  @ApiProperty({ type: GarmentInputDto })
  @ValidateNested()
  @Type(() => GarmentInputDto)
  garment: GarmentInputDto;

  @ApiProperty({ type: CommercialConfigInputDto })
  @ValidateNested()
  @Type(() => CommercialConfigInputDto)
  commercialConfig: CommercialConfigInputDto;

  @ApiPropertyOptional({ example: 'Buzo en muy buen estado', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_DESCRIPTION_LENGTH)
  description?: string | null;

  @ApiProperty({ type: LocationInputDto })
  @ValidateNested()
  @Type(() => LocationInputDto)
  location: LocationInputDto;
}

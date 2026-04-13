import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateListingDto {
  @ApiPropertyOptional({ type: GarmentInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GarmentInputDto)
  garment?: GarmentInputDto;

  @ApiPropertyOptional({ type: CommercialConfigInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommercialConfigInputDto)
  commercialConfig?: CommercialConfigInputDto;

  @ApiPropertyOptional({
    example: 'Actualizado con más detalles y mejor descripción.',
    nullable: true,
  })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_DESCRIPTION_LENGTH)
  description?: string | null;

  @ApiPropertyOptional({ type: LocationInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationInputDto)
  location?: LocationInputDto;
}

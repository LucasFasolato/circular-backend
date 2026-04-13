import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';
import { TradePreferencesInputDto } from './trade-preferences-input.dto';

export class CommercialConfigInputDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  allowsPurchase: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  allowsTrade: boolean;

  @ApiPropertyOptional({ example: 18000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(LISTING_LIMITS.MAX_PRICE_ARS)
  price?: number | null;

  @ApiPropertyOptional({ type: TradePreferencesInputDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => TradePreferencesInputDto)
  tradePreferences?: TradePreferencesInputDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GarmentCondition } from '../../domain/garment-condition.enum';
import { GarmentSize } from '../../domain/garment-size.enum';
import { ListingCategory } from '../../domain/listing-category.enum';
import { LISTING_LIMITS } from '../../domain/listing-limits.constants';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class GarmentInputDto {
  @ApiProperty({ enum: ListingCategory, example: ListingCategory.TOPS })
  @IsEnum(ListingCategory)
  category: ListingCategory;

  @ApiPropertyOptional({ example: 'HOODIE', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_SUBCATEGORY_LENGTH)
  subcategory?: string | null;

  @ApiProperty({ enum: GarmentSize, example: GarmentSize.M })
  @IsEnum(GarmentSize)
  size: GarmentSize;

  @ApiProperty({
    enum: GarmentCondition,
    example: GarmentCondition.USED_GOOD,
  })
  @IsEnum(GarmentCondition)
  condition: GarmentCondition;

  @ApiPropertyOptional({ example: 'Nike', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_BRAND_LENGTH)
  brand?: string | null;

  @ApiPropertyOptional({ example: 'Black', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_COLOR_LENGTH)
  color?: string | null;

  @ApiPropertyOptional({ example: 'Cotton', nullable: true })
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(LISTING_LIMITS.MAX_MATERIAL_LENGTH)
  material?: string | null;
}

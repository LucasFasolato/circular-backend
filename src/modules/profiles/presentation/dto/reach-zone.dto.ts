import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PROFILE_LIMITS } from '../../domain/profile-limits.constants';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ReachZoneInputDto {
  @ApiProperty({ example: 'Rosario' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty({ message: 'city should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_CITY_LENGTH, {
    message: `city must not exceed ${PROFILE_LIMITS.MAX_CITY_LENGTH} characters`,
  })
  city: string;

  @ApiProperty({ example: 'Centro' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty({ message: 'zone should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_ZONE_LENGTH, {
    message: `zone must not exceed ${PROFILE_LIMITS.MAX_ZONE_LENGTH} characters`,
  })
  zone: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROFILE_LIMITS } from '../../domain/profile-limits.constants';

function trimOrPassthrough(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateMyProfileDto {
  @ApiPropertyOptional({ example: 'Lucas' })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'firstName should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_FIRST_NAME_LENGTH, {
    message: `firstName must not exceed ${PROFILE_LIMITS.MAX_FIRST_NAME_LENGTH} characters`,
  })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Fasolato', nullable: true })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'lastName should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_LAST_NAME_LENGTH, {
    message: `lastName must not exceed ${PROFILE_LIMITS.MAX_LAST_NAME_LENGTH} characters`,
  })
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'lucasfaso', nullable: true })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'instagramHandle should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_INSTAGRAM_HANDLE_LENGTH, {
    message: `instagramHandle must not exceed ${PROFILE_LIMITS.MAX_INSTAGRAM_HANDLE_LENGTH} characters`,
  })
  instagramHandle?: string | null;

  @ApiPropertyOptional({ example: 'Rosario' })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'city should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_CITY_LENGTH, {
    message: `city must not exceed ${PROFILE_LIMITS.MAX_CITY_LENGTH} characters`,
  })
  city?: string;

  @ApiPropertyOptional({ example: 'Centro', nullable: true })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'zone should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_ZONE_LENGTH, {
    message: `zone must not exceed ${PROFILE_LIMITS.MAX_ZONE_LENGTH} characters`,
  })
  zone?: string | null;

  @ApiPropertyOptional({
    example: 'Me interesa la ropa urbana y las permutas prolijas.',
    nullable: true,
  })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'bio should not be empty' })
  @MaxLength(PROFILE_LIMITS.MAX_BIO_LENGTH, {
    message: `bio must not exceed ${PROFILE_LIMITS.MAX_BIO_LENGTH} characters`,
  })
  bio?: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.circular.example/avatar.jpg',
    nullable: true,
  })
  @Transform(({ value }) => trimOrPassthrough(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'avatarUrl should not be empty' })
  avatarUrl?: string | null;
}

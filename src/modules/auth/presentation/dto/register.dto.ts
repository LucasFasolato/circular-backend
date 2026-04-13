import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterDto {
  @ApiProperty({
    example: 'Lucas',
    description: 'User first name (max 80 chars)',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty({ message: 'firstName should not be empty' })
  @MaxLength(80, { message: 'firstName must not exceed 80 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Fasolato',
    description: 'User last name (max 80 chars)',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty({ message: 'lastName should not be empty' })
  @MaxLength(80, { message: 'lastName must not exceed 80 characters' })
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address (max 320 chars)',
  })
  @Transform(({ value }) => trimString(value))
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must not exceed 320 characters' })
  email: string;

  @ApiProperty({
    example: '+12125551234',
    description: 'Phone number in E.164 format (e.g. +12125551234)',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must be a valid E.164 number (e.g. +12125551234)',
  })
  phone: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (min 8 chars, max 128 chars)',
    minLength: 8,
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  password: string;
}

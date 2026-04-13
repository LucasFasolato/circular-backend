import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address (max 320 chars)',
  })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(320, { message: 'email must not exceed 320 characters' })
  email: string;

  @ApiProperty({
    example: '+12125551234',
    description: 'Phone number in E.164 format (e.g. +12125551234)',
  })
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
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  @MaxLength(128, { message: 'password must not exceed 128 characters' })
  password: string;
}

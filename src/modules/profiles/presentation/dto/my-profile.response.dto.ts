import { ApiProperty } from '@nestjs/swagger';

export class ReachZoneDto {
  @ApiProperty({ example: 'Rosario' })
  city: string;

  @ApiProperty({ example: 'Centro' })
  zone: string;
}

class MyProfileUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '+5493410000000' })
  phone: string;

  @ApiProperty({ example: false })
  isPhoneVerified: boolean;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2026-04-13T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: 'Lucas' })
  firstName: string;

  @ApiProperty({ example: 'Fasolato', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'lucasfaso', nullable: true })
  instagramHandle: string | null;

  @ApiProperty({ example: 'Rosario' })
  city: string;

  @ApiProperty({ example: 'Centro', nullable: true })
  zone: string | null;

  @ApiProperty({
    example: 'Me interesa la ropa urbana y las permutas prolijas.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'https://cdn.circular.example/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;
}

class MyProfileTrustDto {
  @ApiProperty({ example: true })
  hasInstagram: boolean;

  @ApiProperty({ example: false })
  instagramVerified: boolean;

  @ApiProperty({ example: false })
  manualReviewRequired: boolean;

  @ApiProperty({ example: {}, additionalProperties: true })
  restrictionFlags: Record<string, unknown>;

  @ApiProperty({ example: 8 })
  completedTransactions: number;

  @ApiProperty({ example: 0.88 })
  successRate: number;
}

class MyProfileAvailableActionsDto {
  @ApiProperty({ example: true })
  canEditProfile: boolean;

  @ApiProperty({ example: true })
  canEditReachZones: boolean;
}

export class MyProfileResponseDto {
  @ApiProperty({ type: MyProfileUserDto })
  user: MyProfileUserDto;

  @ApiProperty({ type: MyProfileTrustDto })
  trust: MyProfileTrustDto;

  @ApiProperty({ type: [ReachZoneDto] })
  reachZones: ReachZoneDto[];

  @ApiProperty({ type: MyProfileAvailableActionsDto })
  availableActions: MyProfileAvailableActionsDto;
}

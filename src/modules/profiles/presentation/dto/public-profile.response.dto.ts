import { ApiProperty } from '@nestjs/swagger';

class PublicProfileUserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Martina' })
  firstName: string;

  @ApiProperty({ example: 'Style', nullable: true })
  lastName: string | null;

  @ApiProperty({ example: 'marti.style', nullable: true })
  instagramHandle: string | null;

  @ApiProperty({ example: 'Rosario' })
  city: string;

  @ApiProperty({ example: 'Pichincha', nullable: true })
  zone: string | null;

  @ApiProperty({
    example: 'Interesada en prendas vintage y streetwear.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'https://cdn.circular.example/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;
}

class PublicProfileTrustDto {
  @ApiProperty({ example: true })
  phoneVerified: boolean;

  @ApiProperty({ example: true })
  hasInstagram: boolean;

  @ApiProperty({ example: false })
  instagramVerified: boolean;

  @ApiProperty({ example: 8 })
  completedTransactions: number;

  @ApiProperty({ example: 7 })
  successfulTransactions: number;

  @ApiProperty({ example: 0 })
  failedTransactions: number;

  @ApiProperty({ example: 1 })
  cancelledTransactions: number;

  @ApiProperty({ example: 0.88 })
  successRate: number;

  @ApiProperty({ example: 3, nullable: true })
  avgResponseTimeHours: number | null;
}

class PublicProfileAvailableActionsDto {
  @ApiProperty({ example: true })
  canViewListings: boolean;

  @ApiProperty({ example: false })
  canStartDirectChat: boolean;
}

export class PublicProfileResponseDto {
  @ApiProperty({ type: PublicProfileUserDto })
  user: PublicProfileUserDto;

  @ApiProperty({ type: PublicProfileTrustDto })
  trust: PublicProfileTrustDto;

  @ApiProperty({ type: PublicProfileAvailableActionsDto })
  availableActions: PublicProfileAvailableActionsDto;
}

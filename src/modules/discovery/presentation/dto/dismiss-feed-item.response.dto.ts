import { ApiProperty } from '@nestjs/swagger';

export class DismissFeedItemResponseDto {
  @ApiProperty()
  listingId: string;

  @ApiProperty()
  dismissed: boolean;
}

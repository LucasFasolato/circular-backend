import { ApiProperty } from '@nestjs/swagger';

export class AddListingPhotosRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  photos: unknown[];
}

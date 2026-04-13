import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from '../application/profiles.service';
import { PublicProfileResponseDto } from './dto/public-profile.response.dto';

@ApiTags('Profiles')
@Controller('users')
export class PublicProfileController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':userId/public-profile')
  @ApiOperation({ summary: 'Get public profile summary for a user' })
  @ApiResponse({
    status: 200,
    description: 'Public profile summary',
    type: PublicProfileResponseDto,
  })
  async getPublicProfile(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<PublicProfileResponseDto> {
    return this.profilesService.getPublicProfile(userId);
  }
}

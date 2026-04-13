import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/current-user.decorator';
import { RequestUser } from '../../../shared/request-user.interface';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { ProfilesService } from '../application/profiles.service';
import { MyProfileResponseDto } from './dto/my-profile.response.dto';
import { ReplaceReachZonesDto } from './dto/replace-reach-zones.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@ApiTags('Profiles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get editable current user profile surface' })
  @ApiResponse({
    status: 200,
    description: 'Editable current user profile',
    type: MyProfileResponseDto,
  })
  async getMyProfile(
    @CurrentUser() user: RequestUser,
  ): Promise<MyProfileResponseDto> {
    return this.profilesService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update editable current user profile fields' })
  @ApiResponse({
    status: 200,
    description: 'Updated current user profile',
    type: MyProfileResponseDto,
  })
  async updateMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMyProfileDto,
  ): Promise<MyProfileResponseDto> {
    return this.profilesService.updateMyProfile(user.id, dto);
  }

  @Put('me/reach-zones')
  @ApiOperation({ summary: 'Replace current user reach zones' })
  @ApiResponse({
    status: 200,
    description: 'Updated reach zones',
  })
  async replaceReachZones(
    @CurrentUser() user: RequestUser,
    @Body() dto: ReplaceReachZonesDto,
  ): Promise<{ reachZones: { city: string; zone: string }[] }> {
    return this.profilesService.replaceReachZones(user.id, dto);
  }
}

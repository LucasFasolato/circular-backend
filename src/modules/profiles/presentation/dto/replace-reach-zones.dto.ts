import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PROFILE_LIMITS } from '../../domain/profile-limits.constants';
import { ReachZoneInputDto } from './reach-zone.dto';

export class ReplaceReachZonesDto {
  @ApiProperty({ type: [ReachZoneInputDto] })
  @IsArray()
  @ArrayMaxSize(PROFILE_LIMITS.MAX_REACH_ZONES_PER_USER, {
    message: `reachZones must contain at most ${PROFILE_LIMITS.MAX_REACH_ZONES_PER_USER} items`,
  })
  @ArrayUnique(
    (reachZone: ReachZoneInputDto) =>
      `${reachZone.city.toLowerCase()}::${reachZone.zone.toLowerCase()}`,
  )
  @ValidateNested({ each: true })
  @Type(() => ReachZoneInputDto)
  reachZones: ReachZoneInputDto[];
}

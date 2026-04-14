import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationModule } from '../reputation/reputation.module';
import { UserEntity } from '../auth/domain/user.entity';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { UserRepository } from '../auth/infrastructure/user.repository';
import { ProfileBootstrapService } from './application/profile-bootstrap.service';
import { ProfilesService } from './application/profiles.service';
import { PublicProfileEntity } from './domain/public-profile.entity';
import { ReachZoneEntity } from './domain/reach-zone.entity';
import { TrustProfileEntity } from './domain/trust-profile.entity';
import { PublicProfileRepository } from './infrastructure/public-profile.repository';
import { ReachZoneRepository } from './infrastructure/reach-zone.repository';
import { TrustProfileRepository } from './infrastructure/trust-profile.repository';
import { ProfileController } from './presentation/profile.controller';
import { PublicProfileController } from './presentation/public-profile.controller';

@Module({
  imports: [
    ReputationModule,
    TypeOrmModule.forFeature([
      UserEntity,
      PublicProfileEntity,
      TrustProfileEntity,
      ReachZoneEntity,
    ]),
  ],
  controllers: [ProfileController, PublicProfileController],
  providers: [
    JwtAuthGuard,
    UserRepository,
    PublicProfileRepository,
    TrustProfileRepository,
    ReachZoneRepository,
    ProfileBootstrapService,
    ProfilesService,
  ],
  exports: [ProfileBootstrapService],
})
export class ProfilesModule {}

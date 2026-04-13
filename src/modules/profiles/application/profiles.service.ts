import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { UserEntity } from '../../auth/domain/user.entity';
import { UserRepository } from '../../auth/infrastructure/user.repository';
import { PublicProfileEntity } from '../domain/public-profile.entity';
import { ReputationProfileEntity } from '../domain/reputation-profile.entity';
import { TrustProfileEntity } from '../domain/trust-profile.entity';
import { PublicProfileRepository } from '../infrastructure/public-profile.repository';
import { ReachZoneRepository } from '../infrastructure/reach-zone.repository';
import { ReputationProfileRepository } from '../infrastructure/reputation-profile.repository';
import { TrustProfileRepository } from '../infrastructure/trust-profile.repository';
import {
  MyProfileResponseDto,
  ReachZoneDto,
} from '../presentation/dto/my-profile.response.dto';
import { PublicProfileResponseDto } from '../presentation/dto/public-profile.response.dto';
import { ReplaceReachZonesDto } from '../presentation/dto/replace-reach-zones.dto';
import { UpdateMyProfileDto } from '../presentation/dto/update-my-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly publicProfileRepository: PublicProfileRepository,
    private readonly trustProfileRepository: TrustProfileRepository,
    private readonly reachZoneRepository: ReachZoneRepository,
    private readonly reputationProfileRepository: ReputationProfileRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getMyProfile(userId: string): Promise<MyProfileResponseDto> {
    const { user, publicProfile, trustProfile, reputationProfile, reachZones } =
      await this.loadProfileBundle(userId, true);

    return this.buildMyProfileResponse(
      user,
      publicProfile,
      trustProfile,
      reputationProfile,
      reachZones,
    );
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateMyProfileDto,
  ): Promise<MyProfileResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const publicProfile = await this.publicProfileRepository.findByUserId(
        userId,
        manager,
      );
      const trustProfile = await this.trustProfileRepository.findByUserId(
        userId,
        manager,
      );

      if (!publicProfile || !trustProfile) {
        throw new NotFoundError('Profile not found');
      }

      if (dto.firstName !== undefined) {
        publicProfile.firstName = dto.firstName;
      }

      if (dto.lastName !== undefined) {
        publicProfile.lastName = dto.lastName;
      }

      if (dto.instagramHandle !== undefined) {
        const previousHandle = publicProfile.instagramHandle;
        publicProfile.instagramHandle = dto.instagramHandle;
        trustProfile.hasInstagram = dto.instagramHandle !== null;

        if (
          dto.instagramHandle === null ||
          dto.instagramHandle !== previousHandle
        ) {
          trustProfile.instagramVerified = false;
        }
      }

      if (dto.city !== undefined) {
        publicProfile.city = dto.city;
      }

      if (dto.zone !== undefined) {
        publicProfile.zone = dto.zone;
      }

      if (dto.bio !== undefined) {
        publicProfile.bio = dto.bio;
      }

      if (dto.avatarUrl !== undefined) {
        publicProfile.avatarUrl = dto.avatarUrl;
      }

      await this.publicProfileRepository.save(publicProfile, manager);
      await this.trustProfileRepository.save(trustProfile, manager);
    });

    return this.getMyProfile(userId);
  }

  async replaceReachZones(
    userId: string,
    dto: ReplaceReachZonesDto,
  ): Promise<{ reachZones: ReachZoneDto[] }> {
    await this.ensureUserExists(userId);

    await this.dataSource.transaction(async (manager) => {
      await this.reachZoneRepository.replaceForUser(
        userId,
        dto.reachZones,
        manager,
      );
    });

    const reachZones = await this.reachZoneRepository.findByUserId(userId);

    return {
      reachZones: reachZones.map((zone) => ({
        city: zone.city,
        zone: zone.zone,
      })),
    };
  }

  async getPublicProfile(userId: string): Promise<PublicProfileResponseDto> {
    const { user, publicProfile, trustProfile, reputationProfile } =
      await this.loadProfileBundle(userId, false);

    return {
      user: {
        id: user.id,
        firstName: publicProfile.firstName,
        lastName: publicProfile.lastName,
        instagramHandle: publicProfile.instagramHandle,
        city: publicProfile.city,
        zone: publicProfile.zone,
        bio: publicProfile.bio,
        avatarUrl: publicProfile.avatarUrl,
      },
      trust: {
        phoneVerified: user.isPhoneVerified,
        hasInstagram: trustProfile.hasInstagram,
        instagramVerified: trustProfile.instagramVerified,
        completedTransactions: reputationProfile.completedTransactionsCount,
        successfulTransactions: reputationProfile.successfulTransactionsCount,
        failedTransactions: reputationProfile.failedTransactionsCount,
        cancelledTransactions: reputationProfile.cancelledTransactionsCount,
        successRate: Number(reputationProfile.successRate),
        avgResponseTimeHours:
          reputationProfile.avgResponseTimeHours !== null
            ? Number(reputationProfile.avgResponseTimeHours)
            : null,
      },
      availableActions: {
        canViewListings: true,
        canStartDirectChat: false,
      },
    };
  }

  private async loadProfileBundle(
    userId: string,
    includeReachZones: boolean,
  ): Promise<{
    user: UserEntity;
    publicProfile: PublicProfileEntity;
    trustProfile: TrustProfileEntity;
    reputationProfile: ReputationProfileEntity;
    reachZones: ReachZoneDto[];
  }> {
    const [user, publicProfile, trustProfile, reputationProfile, reachZones] =
      await Promise.all([
        this.userRepository.findById(userId),
        this.publicProfileRepository.findByUserId(userId),
        this.trustProfileRepository.findByUserId(userId),
        this.reputationProfileRepository.findByUserId(userId),
        includeReachZones
          ? this.reachZoneRepository.findByUserId(userId)
          : Promise.resolve([]),
      ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!publicProfile || !trustProfile || !reputationProfile) {
      throw new NotFoundError('Profile not found');
    }

    return {
      user,
      publicProfile,
      trustProfile,
      reputationProfile,
      reachZones: reachZones.map((zone) => ({
        city: zone.city,
        zone: zone.zone,
      })),
    };
  }

  private buildMyProfileResponse(
    user: UserEntity,
    publicProfile: PublicProfileEntity,
    trustProfile: TrustProfileEntity,
    reputationProfile: ReputationProfileEntity,
    reachZones: ReachZoneDto[],
  ): MyProfileResponseDto {
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phoneE164,
        isPhoneVerified: user.isPhoneVerified,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        firstName: publicProfile.firstName,
        lastName: publicProfile.lastName,
        instagramHandle: publicProfile.instagramHandle,
        city: publicProfile.city,
        zone: publicProfile.zone,
        bio: publicProfile.bio,
        avatarUrl: publicProfile.avatarUrl,
      },
      trust: {
        hasInstagram: trustProfile.hasInstagram,
        instagramVerified: trustProfile.instagramVerified,
        manualReviewRequired: trustProfile.manualReviewRequired,
        restrictionFlags: trustProfile.restrictionFlags,
        completedTransactions: reputationProfile.completedTransactionsCount,
        successRate: Number(reputationProfile.successRate),
      },
      reachZones,
      availableActions: {
        canEditProfile: true,
        canEditReachZones: true,
      },
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }
  }
}

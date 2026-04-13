import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PublicProfileRepository } from '../infrastructure/public-profile.repository';
import { ReputationProfileRepository } from '../infrastructure/reputation-profile.repository';
import { TrustProfileRepository } from '../infrastructure/trust-profile.repository';

interface BootstrapRegisteredUserInput {
  userId: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class ProfileBootstrapService {
  constructor(
    private readonly publicProfileRepository: PublicProfileRepository,
    private readonly trustProfileRepository: TrustProfileRepository,
    private readonly reputationProfileRepository: ReputationProfileRepository,
  ) {}

  async bootstrapForRegisteredUser(
    input: BootstrapRegisteredUserInput,
    manager: EntityManager,
  ): Promise<void> {
    await this.publicProfileRepository.create(
      {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        instagramHandle: null,
        city: '',
        zone: null,
        bio: null,
        avatarUrl: null,
      },
      manager,
    );

    await this.trustProfileRepository.create(
      {
        userId: input.userId,
        hasInstagram: false,
        instagramVerified: false,
        manualReviewRequired: false,
        restrictionFlags: {},
      },
      manager,
    );

    await this.reputationProfileRepository.create(
      {
        userId: input.userId,
        completedTransactionsCount: 0,
        successfulTransactionsCount: 0,
        failedTransactionsCount: 0,
        cancelledTransactionsCount: 0,
        successRate: '0',
        avgResponseTimeHours: null,
        lastRecomputedAt: null,
      },
      manager,
    );
  }
}

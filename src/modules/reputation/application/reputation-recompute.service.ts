import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ReputationEntryRepository } from '../infrastructure/reputation-entry.repository';
import { ReputationProfileSnapshotRepository } from '../infrastructure/reputation-profile-snapshot.repository';

@Injectable()
export class ReputationRecomputeService {
  constructor(
    private readonly reputationEntryRepository: ReputationEntryRepository,
    private readonly reputationProfileSnapshotRepository: ReputationProfileSnapshotRepository,
  ) {}

  async recomputeForUser(
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.reputationProfileSnapshotRepository.ensureExists(
      userId,
      manager,
    );

    const aggregate = await this.reputationEntryRepository.getAggregateByUserId(
      userId,
      manager,
    );
    const profile = await this.reputationProfileSnapshotRepository.findByUserId(
      userId,
      manager,
    );

    if (!profile) {
      return;
    }

    profile.completedTransactionsCount = aggregate.completedTransactionsCount;
    profile.successfulTransactionsCount = aggregate.successfulTransactionsCount;
    profile.failedTransactionsCount = aggregate.failedTransactionsCount;
    profile.cancelledTransactionsCount = aggregate.cancelledTransactionsCount;
    profile.successRate =
      aggregate.completedTransactionsCount > 0
        ? (
            aggregate.successfulTransactionsCount /
            aggregate.completedTransactionsCount
          ).toFixed(4)
        : '0';
    profile.avgResponseTimeHours =
      aggregate.avgResponseTimeHours !== null
        ? aggregate.avgResponseTimeHours.toFixed(2)
        : null;
    profile.lastRecomputedAt = new Date();

    await this.reputationProfileSnapshotRepository.save(profile, manager);
  }

  async recomputeMany(
    userIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)];

    for (const userId of uniqueUserIds) {
      await this.recomputeForUser(userId, manager);
    }
  }
}

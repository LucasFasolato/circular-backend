import { ReputationRecomputeService } from './reputation-recompute.service';

describe('ReputationRecomputeService', () => {
  function createService(aggregateOverride?: {
    completedTransactionsCount?: number;
    successfulTransactionsCount?: number;
    failedTransactionsCount?: number;
    cancelledTransactionsCount?: number;
    avgResponseTimeHours?: number | null;
  }) {
    const aggregate = {
      completedTransactionsCount: 0,
      successfulTransactionsCount: 0,
      failedTransactionsCount: 0,
      cancelledTransactionsCount: 0,
      avgResponseTimeHours: null,
      ...aggregateOverride,
    };
    const profile = {
      userId: 'usr-1',
      completedTransactionsCount: 99,
      successfulTransactionsCount: 99,
      failedTransactionsCount: 99,
      cancelledTransactionsCount: 99,
      successRate: '0.9999',
      avgResponseTimeHours: '99.99',
      lastRecomputedAt: null,
    };
    const reputationEntryRepository = {
      getAggregateByUserId: jest.fn().mockResolvedValue(aggregate),
    };
    const reputationProfileSnapshotRepository = {
      ensureExists: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn().mockResolvedValue(profile),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    return {
      service: new ReputationRecomputeService(
        reputationEntryRepository as never,
        reputationProfileSnapshotRepository as never,
      ),
      profile,
      getAggregateByUserId: reputationEntryRepository.getAggregateByUserId,
      save: reputationProfileSnapshotRepository.save,
    };
  }

  it('updates the snapshot correctly from persisted aggregates', async () => {
    const { service, profile, save } = createService({
      completedTransactionsCount: 5,
      successfulTransactionsCount: 4,
      failedTransactionsCount: 0,
      cancelledTransactionsCount: 1,
      avgResponseTimeHours: 2.345,
    });

    await service.recomputeForUser('usr-1');

    expect(profile.completedTransactionsCount).toBe(5);
    expect(profile.successfulTransactionsCount).toBe(4);
    expect(profile.cancelledTransactionsCount).toBe(1);
    expect(profile.successRate).toBe('0.8000');
    expect(profile.avgResponseTimeHours).toBe('2.35');
    expect(save).toHaveBeenCalled();
  });

  it('keeps success rate at zero when there are no completed transactions', async () => {
    const { service, profile } = createService({
      completedTransactionsCount: 0,
      successfulTransactionsCount: 0,
      failedTransactionsCount: 0,
      cancelledTransactionsCount: 0,
      avgResponseTimeHours: null,
    });

    await service.recomputeForUser('usr-1');

    expect(profile.successRate).toBe('0');
    expect(profile.avgResponseTimeHours).toBeNull();
  });

  it('is idempotent when recomputed multiple times over the same aggregate', async () => {
    const { service, profile } = createService({
      completedTransactionsCount: 2,
      successfulTransactionsCount: 1,
      failedTransactionsCount: 1,
      cancelledTransactionsCount: 0,
      avgResponseTimeHours: 4,
    });

    await service.recomputeForUser('usr-1');
    const firstSnapshot = { ...profile };
    await service.recomputeForUser('usr-1');

    expect(profile).toMatchObject(firstSnapshot);
  });
});

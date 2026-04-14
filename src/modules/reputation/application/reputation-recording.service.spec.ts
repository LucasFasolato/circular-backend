import { MatchSessionState } from '../../matches/domain/match-session-state.enum';
import { ReputationEntryType } from '../domain/reputation-entry-type.enum';
import { ReputationRecordingService } from './reputation-recording.service';
import { ReputationRecomputeService } from './reputation-recompute.service';

describe('ReputationRecordingService', () => {
  class InMemoryReputationEntryRepository {
    entries: Array<{
      userId: string;
      matchSessionId: string;
      entryType: string;
      isSuccess: boolean;
      responseTimeHours: string | null;
      wasCancelled: boolean;
      notes: Record<string, unknown>;
    }> = [];

    createManyIgnoreConflicts(
      data: Array<{
        userId: string;
        matchSessionId: string;
        entryType: string;
        isSuccess: boolean;
        responseTimeHours: string | null;
        wasCancelled: boolean;
        notes: Record<string, unknown>;
      }>,
    ): Promise<void> {
      for (const item of data) {
        const exists = this.entries.some(
          (entry) =>
            entry.userId === item.userId &&
            entry.matchSessionId === item.matchSessionId &&
            entry.entryType === item.entryType,
        );

        if (!exists) {
          this.entries.push(item);
        }
      }

      return Promise.resolve();
    }

    getAggregateByUserId(userId: string) {
      const entries = this.entries.filter((entry) => entry.userId === userId);
      const values = entries
        .map((entry) =>
          entry.responseTimeHours !== null
            ? Number(entry.responseTimeHours)
            : null,
        )
        .filter((value): value is number => value !== null);

      return Promise.resolve({
        completedTransactionsCount: entries.length,
        successfulTransactionsCount: entries.filter((entry) => entry.isSuccess)
          .length,
        failedTransactionsCount: entries.filter(
          (entry) => !entry.isSuccess && !entry.wasCancelled,
        ).length,
        cancelledTransactionsCount: entries.filter(
          (entry) => entry.wasCancelled,
        ).length,
        avgResponseTimeHours:
          values.length > 0
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null,
      });
    }

    countDuplicateTriplets(): Promise<number> {
      return Promise.resolve(0);
    }
  }

  class InMemoryReputationProfileSnapshotRepository {
    profiles = new Map<
      string,
      {
        userId: string;
        completedTransactionsCount: number;
        successfulTransactionsCount: number;
        failedTransactionsCount: number;
        cancelledTransactionsCount: number;
        successRate: string;
        avgResponseTimeHours: string | null;
        lastRecomputedAt: Date | null;
      }
    >();

    findByUserId(userId: string) {
      return Promise.resolve(this.profiles.get(userId) ?? null);
    }

    create(data: {
      userId: string;
      completedTransactionsCount: number;
      successfulTransactionsCount: number;
      failedTransactionsCount: number;
      cancelledTransactionsCount: number;
      successRate: string;
      avgResponseTimeHours: string | null;
      lastRecomputedAt: Date | null;
    }) {
      this.profiles.set(data.userId, { ...data });
      return Promise.resolve(this.profiles.get(data.userId) ?? null);
    }

    save(entity: {
      userId: string;
      completedTransactionsCount: number;
      successfulTransactionsCount: number;
      failedTransactionsCount: number;
      cancelledTransactionsCount: number;
      successRate: string;
      avgResponseTimeHours: string | null;
      lastRecomputedAt: Date | null;
    }) {
      this.profiles.set(entity.userId, entity);
      return Promise.resolve(entity);
    }

    async ensureExists(userId: string) {
      if (!this.profiles.has(userId)) {
        await this.create({
          userId,
          completedTransactionsCount: 0,
          successfulTransactionsCount: 0,
          failedTransactionsCount: 0,
          cancelledTransactionsCount: 0,
          successRate: '0',
          avgResponseTimeHours: null,
          lastRecomputedAt: null,
        });
      }
    }

    countIntegrityViolations() {
      return Promise.resolve({
        invalidSuccessRateProfiles: 0,
        inconsistentCompletedCountProfiles: 0,
        missingReputationProfilesForPublicProfiles: 0,
      });
    }
  }

  function createService() {
    const entryRepository = new InMemoryReputationEntryRepository();
    const snapshotRepository =
      new InMemoryReputationProfileSnapshotRepository();
    const recomputeService = new ReputationRecomputeService(
      entryRepository as never,
      snapshotRepository as never,
    );
    const service = new ReputationRecordingService(
      entryRepository as never,
      recomputeService,
    );

    return {
      service,
      entryRepository,
      snapshotRepository,
    };
  }

  it('generates reputation entries for both users when a match completes', async () => {
    const { service, entryRepository, snapshotRepository } = createService();
    const createdAt = new Date('2026-04-14T10:00:00.000Z');

    await service.recordCompleted({
      id: 'ms-1',
      state: MatchSessionState.COMPLETED,
      createdAt,
      ownerUserId: 'usr-owner',
      counterpartyUserId: 'usr-buyer',
      successConfirmedByOwnerAt: new Date('2026-04-14T12:00:00.000Z'),
      successConfirmedByCounterpartyAt: new Date('2026-04-14T13:00:00.000Z'),
    } as never);

    expect(entryRepository.entries).toHaveLength(2);
    expect(entryRepository.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'usr-owner',
          entryType: ReputationEntryType.MATCH_COMPLETED,
          isSuccess: true,
          responseTimeHours: '2.00',
        }),
        expect.objectContaining({
          userId: 'usr-buyer',
          entryType: ReputationEntryType.MATCH_COMPLETED,
          isSuccess: true,
          responseTimeHours: '3.00',
        }),
      ]),
    );
    expect(snapshotRepository.profiles.get('usr-owner')).toMatchObject({
      completedTransactionsCount: 1,
      successfulTransactionsCount: 1,
      successRate: '1.0000',
    });
  });

  it('generates failed entries for both users and records response time only for the actor', async () => {
    const { service, entryRepository, snapshotRepository } = createService();

    await service.recordFailed(
      {
        id: 'ms-2',
        state: MatchSessionState.FAILED,
        createdAt: new Date('2026-04-14T10:00:00.000Z'),
        ownerUserId: 'usr-owner',
        counterpartyUserId: 'usr-buyer',
        failedAt: new Date('2026-04-14T11:30:00.000Z'),
      } as never,
      'usr-owner',
    );

    expect(entryRepository.entries).toHaveLength(2);
    expect(entryRepository.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'usr-owner',
          entryType: ReputationEntryType.MATCH_FAILED,
          isSuccess: false,
          wasCancelled: false,
          responseTimeHours: '1.50',
        }),
        expect.objectContaining({
          userId: 'usr-buyer',
          entryType: ReputationEntryType.MATCH_FAILED,
          isSuccess: false,
          wasCancelled: false,
          responseTimeHours: null,
        }),
      ]),
    );
    expect(snapshotRepository.profiles.get('usr-owner')).toMatchObject({
      failedTransactionsCount: 1,
      successRate: '0.0000',
    });
  });

  it('does not duplicate entries when the same cancellation is retried', async () => {
    const { service, entryRepository, snapshotRepository } = createService();
    const match = {
      id: 'ms-3',
      state: MatchSessionState.CANCELLED,
      createdAt: new Date('2026-04-14T10:00:00.000Z'),
      ownerUserId: 'usr-owner',
      counterpartyUserId: 'usr-buyer',
      cancelledAt: new Date('2026-04-14T12:00:00.000Z'),
    } as never;

    await service.recordCancelled(match, 'usr-owner');
    await service.recordCancelled(match, 'usr-owner');

    expect(entryRepository.entries).toHaveLength(2);
    expect(snapshotRepository.profiles.get('usr-owner')).toMatchObject({
      completedTransactionsCount: 1,
      cancelledTransactionsCount: 1,
    });
  });
});

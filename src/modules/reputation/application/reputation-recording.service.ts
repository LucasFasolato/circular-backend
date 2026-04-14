import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MatchSessionState } from '../../matches/domain/match-session-state.enum';
import { MatchSessionEntity } from '../../matches/domain/match-session.entity';
import { ReputationEntryType } from '../domain/reputation-entry-type.enum';
import { ReputationEntryRepository } from '../infrastructure/reputation-entry.repository';
import { ReputationRecomputeService } from './reputation-recompute.service';

@Injectable()
export class ReputationRecordingService {
  constructor(
    private readonly reputationEntryRepository: ReputationEntryRepository,
    private readonly reputationRecomputeService: ReputationRecomputeService,
  ) {}

  async recordCompleted(
    match: MatchSessionEntity,
    manager?: EntityManager,
  ): Promise<void> {
    await this.recordEntries(
      [
        {
          userId: match.ownerUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_COMPLETED,
          isSuccess: true,
          responseTimeHours: this.calculateHours(
            match.createdAt,
            match.successConfirmedByOwnerAt,
          ),
          wasCancelled: false,
          notes: {
            matchState: MatchSessionState.COMPLETED,
            role: 'OWNER',
          },
        },
        {
          userId: match.counterpartyUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_COMPLETED,
          isSuccess: true,
          responseTimeHours: this.calculateHours(
            match.createdAt,
            match.successConfirmedByCounterpartyAt,
          ),
          wasCancelled: false,
          notes: {
            matchState: MatchSessionState.COMPLETED,
            role: 'COUNTERPARTY',
          },
        },
      ],
      [match.ownerUserId, match.counterpartyUserId],
      manager,
    );
  }

  async recordFailed(
    match: MatchSessionEntity,
    actorUserId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.recordEntries(
      [
        {
          userId: match.ownerUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_FAILED,
          isSuccess: false,
          responseTimeHours:
            actorUserId === match.ownerUserId
              ? this.calculateHours(match.createdAt, match.failedAt)
              : null,
          wasCancelled: false,
          notes: {
            matchState: MatchSessionState.FAILED,
            actorUserId,
            role: 'OWNER',
          },
        },
        {
          userId: match.counterpartyUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_FAILED,
          isSuccess: false,
          responseTimeHours:
            actorUserId === match.counterpartyUserId
              ? this.calculateHours(match.createdAt, match.failedAt)
              : null,
          wasCancelled: false,
          notes: {
            matchState: MatchSessionState.FAILED,
            actorUserId,
            role: 'COUNTERPARTY',
          },
        },
      ],
      [match.ownerUserId, match.counterpartyUserId],
      manager,
    );
  }

  async recordCancelled(
    match: MatchSessionEntity,
    actorUserId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.recordEntries(
      [
        {
          userId: match.ownerUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_CANCELLED,
          isSuccess: false,
          responseTimeHours:
            actorUserId === match.ownerUserId
              ? this.calculateHours(match.createdAt, match.cancelledAt)
              : null,
          wasCancelled: true,
          notes: {
            matchState: MatchSessionState.CANCELLED,
            actorUserId,
            role: 'OWNER',
          },
        },
        {
          userId: match.counterpartyUserId,
          matchSessionId: match.id,
          entryType: ReputationEntryType.MATCH_CANCELLED,
          isSuccess: false,
          responseTimeHours:
            actorUserId === match.counterpartyUserId
              ? this.calculateHours(match.createdAt, match.cancelledAt)
              : null,
          wasCancelled: true,
          notes: {
            matchState: MatchSessionState.CANCELLED,
            actorUserId,
            role: 'COUNTERPARTY',
          },
        },
      ],
      [match.ownerUserId, match.counterpartyUserId],
      manager,
    );
  }

  private async recordEntries(
    entries: Array<{
      userId: string;
      matchSessionId: string;
      entryType: ReputationEntryType;
      isSuccess: boolean;
      responseTimeHours: number | null;
      wasCancelled: boolean;
      notes: Record<string, unknown>;
    }>,
    userIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    await this.reputationEntryRepository.createManyIgnoreConflicts(
      entries.map((entry) => ({
        userId: entry.userId,
        matchSessionId: entry.matchSessionId,
        entryType: entry.entryType,
        isSuccess: entry.isSuccess,
        responseTimeHours:
          entry.responseTimeHours !== null
            ? entry.responseTimeHours.toFixed(2)
            : null,
        wasCancelled: entry.wasCancelled,
        notes: entry.notes,
      })),
      manager,
    );

    await this.reputationRecomputeService.recomputeMany(userIds, manager);
  }

  private calculateHours(
    from: Date | null | undefined,
    to: Date | null | undefined,
  ): number | null {
    if (!from || !to || to < from) {
      return null;
    }

    return (to.getTime() - from.getTime()) / 3_600_000;
  }
}

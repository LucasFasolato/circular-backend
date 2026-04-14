import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReputationEntryEntity } from '../domain/reputation-entry.entity';

interface ReputationEntryInsertRow {
  userId: string;
  matchSessionId: string;
  entryType: string;
  isSuccess: boolean;
  responseTimeHours: string | null;
  wasCancelled: boolean;
  notes: Record<string, unknown>;
}

@Injectable()
export class ReputationEntryRepository {
  constructor(
    @InjectRepository(ReputationEntryEntity)
    private readonly repo: Repository<ReputationEntryEntity>,
  ) {}

  async createManyIgnoreConflicts(
    data: ReputationEntryInsertRow[],
    manager?: EntityManager,
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }

    const runner = manager ?? this.repo;

    await runner.query(
      `
        INSERT INTO "reputation_entries" (
          "user_id",
          "match_session_id",
          "entry_type",
          "is_success",
          "response_time_hours",
          "was_cancelled",
          "notes"
        )
        SELECT
          item."userId"::uuid,
          item."matchSessionId"::uuid,
          item."entryType",
          item."isSuccess"::boolean,
          item."responseTimeHours"::numeric,
          item."wasCancelled"::boolean,
          item."notes"::jsonb
        FROM jsonb_to_recordset($1::jsonb) AS item(
          "userId" text,
          "matchSessionId" text,
          "entryType" text,
          "isSuccess" boolean,
          "responseTimeHours" text,
          "wasCancelled" boolean,
          "notes" jsonb
        )
        ON CONFLICT ("user_id", "match_session_id", "entry_type") DO NOTHING
      `,
      [JSON.stringify(data)],
    );
  }

  async getAggregateByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<{
    completedTransactionsCount: number;
    successfulTransactionsCount: number;
    failedTransactionsCount: number;
    cancelledTransactionsCount: number;
    avgResponseTimeHours: number | null;
  }> {
    const repo = manager
      ? manager.getRepository(ReputationEntryEntity)
      : this.repo;
    const rawUnknown: unknown = await repo.query(
      `
        SELECT
          COUNT(*)::int AS completed_transactions_count,
          COALESCE(SUM(CASE WHEN "is_success" THEN 1 ELSE 0 END), 0)::int
            AS successful_transactions_count,
          COALESCE(SUM(CASE WHEN NOT "is_success" AND NOT "was_cancelled" THEN 1 ELSE 0 END), 0)::int
            AS failed_transactions_count,
          COALESCE(SUM(CASE WHEN "was_cancelled" THEN 1 ELSE 0 END), 0)::int
            AS cancelled_transactions_count,
          AVG("response_time_hours")::numeric AS avg_response_time_hours
        FROM "reputation_entries"
        WHERE "user_id" = $1
      `,
      [userId],
    );
    const raw = rawUnknown as Array<{
      completed_transactions_count: string;
      successful_transactions_count: string;
      failed_transactions_count: string;
      cancelled_transactions_count: string;
      avg_response_time_hours: string | null;
    }>;

    const row = (raw[0] ?? {
      completed_transactions_count: '0',
      successful_transactions_count: '0',
      failed_transactions_count: '0',
      cancelled_transactions_count: '0',
      avg_response_time_hours: null,
    }) as {
      completed_transactions_count: string;
      successful_transactions_count: string;
      failed_transactions_count: string;
      cancelled_transactions_count: string;
      avg_response_time_hours: string | null;
    };

    return {
      completedTransactionsCount: Number(row.completed_transactions_count ?? 0),
      successfulTransactionsCount: Number(
        row.successful_transactions_count ?? 0,
      ),
      failedTransactionsCount: Number(row.failed_transactions_count ?? 0),
      cancelledTransactionsCount: Number(row.cancelled_transactions_count ?? 0),
      avgResponseTimeHours:
        row.avg_response_time_hours !== null
          ? Number(row.avg_response_time_hours)
          : null,
    };
  }

  async countDuplicateTriplets(): Promise<number> {
    const rawUnknown: unknown = await this.repo.query(`
      SELECT COALESCE(SUM("duplicate_count"), 0)::int AS total
      FROM (
        SELECT COUNT(*) - 1 AS duplicate_count
        FROM "reputation_entries"
        GROUP BY "user_id", "match_session_id", "entry_type"
        HAVING COUNT(*) > 1
      ) duplicates
    `);
    const raw = rawUnknown as Array<{ total: string }>;

    return Number(raw[0]?.total ?? 0);
  }
}

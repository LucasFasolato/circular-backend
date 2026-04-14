import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MatchReadRepository } from '../infrastructure/match-read.repository';

interface CountRow {
  count: number | string;
}

@Injectable()
export class SystemIntegrityAuditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly matchReadRepository: MatchReadRepository,
  ) {}

  async run(): Promise<{
    activeMatchesPerListingViolations: number;
    reservedListingsWithoutActiveMatch: number;
    activeCommitmentsWithoutMatch: number;
    invalidMatchStates: number;
  }> {
    const [
      activeMatchesPerListingViolations,
      reservedListingsWithoutActiveMatch,
      activeCommitmentsWithoutMatch,
      invalidMatchStates,
    ] = await Promise.all([
      this.countActiveMatchesPerListingViolations(),
      this.matchReadRepository.countReservedListingsWithoutActiveMatch(),
      this.countActiveCommitmentsWithoutMatch(),
      this.countInvalidMatchStates(),
    ]);

    return {
      activeMatchesPerListingViolations,
      reservedListingsWithoutActiveMatch,
      activeCommitmentsWithoutMatch,
      invalidMatchStates,
    };
  }

  private async countActiveMatchesPerListingViolations(): Promise<number> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT COUNT(*)::int AS "count"
        FROM (
          SELECT "listing_id"
          FROM "match_sessions"
          WHERE "state" IN ('OPEN', 'ACTIVE')
          GROUP BY "listing_id"
          HAVING COUNT(*) > 1
        ) violations
      `,
    );
    const rows = rawRows as CountRow[];

    return Number(rows[0]?.count ?? 0);
  }

  private async countActiveCommitmentsWithoutMatch(): Promise<number> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "proposed_listing_commitments" plc
        WHERE plc."state" IN ('RESERVED_FOR_PROPOSAL', 'COMMITTED_TO_MATCH')
          AND (
            plc."match_session_id" IS NULL
            OR NOT EXISTS (
              SELECT 1
              FROM "match_sessions" ms
              WHERE ms."id" = plc."match_session_id"
                AND ms."state" IN ('OPEN', 'ACTIVE', 'COMPLETED')
            )
          )
      `,
    );
    const rows = rawRows as CountRow[];

    return Number(rows[0]?.count ?? 0);
  }

  private async countInvalidMatchStates(): Promise<number> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "match_sessions" ms
        WHERE (
          ms."state" = 'COMPLETED'
          AND (
            ms."success_confirmed_by_owner_at" IS NULL
            OR ms."success_confirmed_by_counterparty_at" IS NULL
          )
        )
      `,
    );
    const rows = rawRows as CountRow[];

    return Number(rows[0]?.count ?? 0);
  }
}

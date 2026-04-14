import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MatchSessionState } from '../domain/match-session-state.enum';

export interface MatchSessionCursor {
  createdAt: string;
  id: string;
}

export interface MatchSnapshot {
  id: string;
  state: string;
  type: string;
  expiresAt: string;
  ownerUserId: string;
  counterpartyUserId: string;
  successConfirmedByOwnerAt: string | null;
  successConfirmedByCounterpartyAt: string | null;
  listing: {
    id: string;
    photo: string | null;
    category: string;
    size: string;
    state: string;
  };
  counterparty: {
    id: string;
    firstName: string;
    instagramHandle: string | null;
  };
  conversation: {
    id: string;
    state: string;
  };
  createdAt: string;
}

interface MatchRow {
  id: string;
  state: string;
  type: string;
  expires_at: Date;
  owner_user_id: string;
  counterparty_user_id: string;
  success_confirmed_by_owner_at: Date | null;
  success_confirmed_by_counterparty_at: Date | null;
  listing_id: string;
  listing_state: string;
  listing_photo: string | null;
  listing_category: string;
  listing_size: string;
  counterparty_id: string;
  counterparty_first_name: string | null;
  counterparty_instagram_handle: string | null;
  conversation_id: string;
  conversation_state: string;
  created_at: Date;
}

interface CountRow {
  count: number | string;
}

@Injectable()
export class MatchReadRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findMyMatchesPage(input: {
    viewerUserId: string;
    limit: number;
    cursor?: MatchSessionCursor;
  }): Promise<MatchSnapshot[]> {
    const params: unknown[] = [input.viewerUserId];
    let cursorClause = '';

    if (input.cursor) {
      params.push(input.cursor.createdAt, input.cursor.id);
      cursorClause = `
        AND (
          ms."created_at" < $2
          OR (ms."created_at" = $2 AND ms."id" < $3)
        )
      `;
    }

    params.push(input.limit);
    const limitParam = params.length;

    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT
          ms."id",
          ms."state",
          ms."type",
          ms."expires_at",
          ms."owner_user_id",
          ms."counterparty_user_id",
          ms."success_confirmed_by_owner_at",
          ms."success_confirmed_by_counterparty_at",
          l."id" AS "listing_id",
          l."state" AS "listing_state",
          lp."public_url" AS "listing_photo",
          g."category" AS "listing_category",
          g."size" AS "listing_size",
          cu."id" AS "counterparty_id",
          pp."first_name" AS "counterparty_first_name",
          pp."instagram_handle" AS "counterparty_instagram_handle",
          ct."id" AS "conversation_id",
          ct."state" AS "conversation_state",
          ms."created_at"
        FROM "match_sessions" ms
        INNER JOIN "listings" l ON l."id" = ms."listing_id"
        INNER JOIN "garments" g ON g."id" = l."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = l."dominant_photo_id"
        INNER JOIN "users" cu
          ON cu."id" = CASE
            WHEN ms."owner_user_id" = $1 THEN ms."counterparty_user_id"
            ELSE ms."owner_user_id"
          END
        LEFT JOIN "public_profiles" pp ON pp."user_id" = cu."id"
        INNER JOIN "conversation_threads" ct ON ct."match_session_id" = ms."id"
        WHERE (ms."owner_user_id" = $1 OR ms."counterparty_user_id" = $1)
        ${cursorClause}
        ORDER BY ms."created_at" DESC, ms."id" DESC
        LIMIT $${limitParam}
      `,
      params,
    );
    const rows = rawRows as MatchRow[];

    return rows.map((row) => this.mapRow(row));
  }

  async findMatchByIdForViewer(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchSnapshot | null> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT
          ms."id",
          ms."state",
          ms."type",
          ms."expires_at",
          ms."owner_user_id",
          ms."counterparty_user_id",
          ms."success_confirmed_by_owner_at",
          ms."success_confirmed_by_counterparty_at",
          l."id" AS "listing_id",
          l."state" AS "listing_state",
          lp."public_url" AS "listing_photo",
          g."category" AS "listing_category",
          g."size" AS "listing_size",
          cu."id" AS "counterparty_id",
          pp."first_name" AS "counterparty_first_name",
          pp."instagram_handle" AS "counterparty_instagram_handle",
          ct."id" AS "conversation_id",
          ct."state" AS "conversation_state",
          ms."created_at"
        FROM "match_sessions" ms
        INNER JOIN "listings" l ON l."id" = ms."listing_id"
        INNER JOIN "garments" g ON g."id" = l."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = l."dominant_photo_id"
        INNER JOIN "users" cu
          ON cu."id" = CASE
            WHEN ms."owner_user_id" = $1 THEN ms."counterparty_user_id"
            ELSE ms."owner_user_id"
          END
        LEFT JOIN "public_profiles" pp ON pp."user_id" = cu."id"
        INNER JOIN "conversation_threads" ct ON ct."match_session_id" = ms."id"
        WHERE ms."id" = $2
          AND (ms."owner_user_id" = $1 OR ms."counterparty_user_id" = $1)
        LIMIT 1
      `,
      [viewerUserId, matchSessionId],
    );
    const rows = rawRows as MatchRow[];

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findMatchByConversationIdForViewer(
    viewerUserId: string,
    conversationId: string,
  ): Promise<MatchSnapshot | null> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT
          ms."id",
          ms."state",
          ms."type",
          ms."expires_at",
          ms."owner_user_id",
          ms."counterparty_user_id",
          ms."success_confirmed_by_owner_at",
          ms."success_confirmed_by_counterparty_at",
          l."id" AS "listing_id",
          l."state" AS "listing_state",
          lp."public_url" AS "listing_photo",
          g."category" AS "listing_category",
          g."size" AS "listing_size",
          cu."id" AS "counterparty_id",
          pp."first_name" AS "counterparty_first_name",
          pp."instagram_handle" AS "counterparty_instagram_handle",
          ct."id" AS "conversation_id",
          ct."state" AS "conversation_state",
          ms."created_at"
        FROM "match_sessions" ms
        INNER JOIN "listings" l ON l."id" = ms."listing_id"
        INNER JOIN "garments" g ON g."id" = l."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = l."dominant_photo_id"
        INNER JOIN "users" cu
          ON cu."id" = CASE
            WHEN ms."owner_user_id" = $1 THEN ms."counterparty_user_id"
            ELSE ms."owner_user_id"
          END
        LEFT JOIN "public_profiles" pp ON pp."user_id" = cu."id"
        INNER JOIN "conversation_threads" ct ON ct."match_session_id" = ms."id"
        WHERE ct."id" = $2
          AND (ms."owner_user_id" = $1 OR ms."counterparty_user_id" = $1)
        LIMIT 1
      `,
      [viewerUserId, conversationId],
    );
    const rows = rawRows as MatchRow[];

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async countReservedListingsWithoutActiveMatch(): Promise<number> {
    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT COUNT(*)::int AS "count"
        FROM "listings" l
        WHERE l."state" = 'RESERVED'
          AND NOT EXISTS (
            SELECT 1
            FROM "match_sessions" ms
            WHERE ms."listing_id" = l."id"
              AND ms."state" IN ($1, $2)
          )
      `,
      [MatchSessionState.OPEN, MatchSessionState.ACTIVE],
    );
    const rows = rawRows as CountRow[];

    return Number(rows[0]?.count ?? 0);
  }

  private mapRow(row: MatchRow): MatchSnapshot {
    return {
      id: row.id,
      state: row.state,
      type: row.type,
      expiresAt: row.expires_at.toISOString(),
      ownerUserId: row.owner_user_id,
      counterpartyUserId: row.counterparty_user_id,
      successConfirmedByOwnerAt:
        row.success_confirmed_by_owner_at?.toISOString() ?? null,
      successConfirmedByCounterpartyAt:
        row.success_confirmed_by_counterparty_at?.toISOString() ?? null,
      listing: {
        id: row.listing_id,
        photo: row.listing_photo,
        category: row.listing_category,
        size: row.listing_size,
        state: row.listing_state,
      },
      counterparty: {
        id: row.counterparty_id,
        firstName: row.counterparty_first_name ?? '',
        instagramHandle: row.counterparty_instagram_handle ?? null,
      },
      conversation: {
        id: row.conversation_id,
        state: row.conversation_state,
      },
      createdAt: row.created_at.toISOString(),
    };
  }
}

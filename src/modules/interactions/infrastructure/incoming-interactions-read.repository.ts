import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InteractionType } from '../domain/interaction-type.enum';
import { IncomingInteractionsTypeFilter } from '../presentation/dto/list-incoming-interactions-query.dto';
import { IncomingInteractionSnapshot } from '../read-models/incoming-interaction-item.builder';

export interface IncomingInteractionsCursor {
  createdAt: string;
  interactionType: InteractionType;
  id: string;
}

interface IncomingBaseRow {
  interaction_type: InteractionType;
  id: string;
  state: string;
  created_at: string;
  target_listing_id: string;
  target_photo: string | null;
  target_category: string;
  target_size: string;
  interested_user_id: string;
  interested_first_name: string | null;
  completed_transactions: string | number | null;
  success_rate: string | number | null;
  avg_response_time_hours: string | number | null;
}

interface ProposedItemRow {
  trade_proposal_id: string;
  proposed_listing_id: string;
  proposed_photo: string | null;
  proposed_category: string;
  proposed_size: string;
}

export interface IncomingInteractionPageItem extends IncomingInteractionSnapshot {
  createdAt: string;
}

@Injectable()
export class IncomingInteractionsReadRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findIncomingPage(input: {
    ownerUserId: string;
    type: IncomingInteractionsTypeFilter;
    limit: number;
    cursor?: IncomingInteractionsCursor;
  }): Promise<IncomingInteractionPageItem[]> {
    const branches = this.buildBranches(input.type);
    const params: unknown[] = [input.ownerUserId];
    const cursorClause = this.buildCursorClause(input.cursor, params);
    params.push(input.limit);

    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT *
        FROM (
          ${branches.join('\nUNION ALL\n')}
        ) AS incoming
        ${cursorClause}
        ORDER BY "created_at" DESC, "interaction_type" DESC, "id" DESC
        LIMIT $${params.length}
      `,
      params,
    );
    const rows = rawRows as IncomingBaseRow[];

    const tradeProposalIds = rows
      .filter((row) => row.interaction_type === InteractionType.TRADE_PROPOSAL)
      .map((row) => row.id);
    const proposedItems = await this.findProposedItems(tradeProposalIds);
    const proposedItemsMap = proposedItems.reduce<
      Record<string, ProposedItemRow[]>
    >((acc, row) => {
      acc[row.trade_proposal_id] ??= [];
      acc[row.trade_proposal_id].push(row);
      return acc;
    }, {});

    return rows.map((row) => ({
      interactionType: row.interaction_type,
      id: row.id,
      state: row.state,
      createdAt: row.created_at,
      targetListing: {
        id: row.target_listing_id,
        photo: row.target_photo,
        category: row.target_category,
        size: row.target_size,
      },
      interestedUser: {
        id: row.interested_user_id,
        firstName: row.interested_first_name ?? '',
        trust: {
          completedTransactions: Number(row.completed_transactions ?? 0),
          successRate: Number(row.success_rate ?? 0),
          avgResponseTimeHours:
            row.avg_response_time_hours === null
              ? null
              : Number(row.avg_response_time_hours),
        },
      },
      proposedItems:
        row.interaction_type === InteractionType.TRADE_PROPOSAL
          ? (proposedItemsMap[row.id] ?? []).map((item) => ({
              id: item.proposed_listing_id,
              photo: item.proposed_photo,
              category: item.proposed_category,
              size: item.proposed_size,
            }))
          : null,
    }));
  }

  private buildBranches(type: IncomingInteractionsTypeFilter): string[] {
    const branches: string[] = [];

    if (
      type === IncomingInteractionsTypeFilter.ALL ||
      type === IncomingInteractionsTypeFilter.PURCHASE
    ) {
      branches.push(`
        SELECT
          '${InteractionType.PURCHASE_INTENT}' AS "interaction_type",
          pi."id" AS "id",
          pi."state" AS "state",
          pi."created_at" AS "created_at",
          l."id" AS "target_listing_id",
          lp."public_url" AS "target_photo",
          g."category" AS "target_category",
          g."size" AS "target_size",
          pi."buyer_user_id" AS "interested_user_id",
          pp."first_name" AS "interested_first_name",
          rp."completed_transactions_count" AS "completed_transactions",
          rp."success_rate" AS "success_rate",
          rp."avg_response_time_hours" AS "avg_response_time_hours"
        FROM "purchase_intents" pi
        INNER JOIN "listings" l ON l."id" = pi."listing_id"
        INNER JOIN "garments" g ON g."id" = l."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = l."dominant_photo_id"
        LEFT JOIN "public_profiles" pp ON pp."user_id" = pi."buyer_user_id"
        LEFT JOIN "reputation_profiles" rp ON rp."user_id" = pi."buyer_user_id"
        WHERE pi."listing_owner_user_id" = $1
      `);
    }

    if (
      type === IncomingInteractionsTypeFilter.ALL ||
      type === IncomingInteractionsTypeFilter.TRADE
    ) {
      branches.push(`
        SELECT
          '${InteractionType.TRADE_PROPOSAL}' AS "interaction_type",
          tp."id" AS "id",
          tp."state" AS "state",
          tp."created_at" AS "created_at",
          l."id" AS "target_listing_id",
          lp."public_url" AS "target_photo",
          g."category" AS "target_category",
          g."size" AS "target_size",
          tp."proposer_user_id" AS "interested_user_id",
          pp."first_name" AS "interested_first_name",
          rp."completed_transactions_count" AS "completed_transactions",
          rp."success_rate" AS "success_rate",
          rp."avg_response_time_hours" AS "avg_response_time_hours"
        FROM "trade_proposals" tp
        INNER JOIN "listings" l ON l."id" = tp."target_listing_id"
        INNER JOIN "garments" g ON g."id" = l."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = l."dominant_photo_id"
        LEFT JOIN "public_profiles" pp ON pp."user_id" = tp."proposer_user_id"
        LEFT JOIN "reputation_profiles" rp ON rp."user_id" = tp."proposer_user_id"
        WHERE tp."target_listing_owner_user_id" = $1
      `);
    }

    return branches;
  }

  private buildCursorClause(
    cursor: IncomingInteractionsCursor | undefined,
    params: unknown[],
  ): string {
    if (!cursor) {
      return '';
    }

    params.push(cursor.createdAt, cursor.interactionType, cursor.id);
    const createdAtParam = params.length - 2;
    const typeParam = params.length - 1;
    const idParam = params.length;

    return `
      WHERE (
        "created_at" < $${createdAtParam}
        OR (
          "created_at" = $${createdAtParam}
          AND (
            "interaction_type" < $${typeParam}
            OR (
              "interaction_type" = $${typeParam}
              AND "id" < $${idParam}
            )
          )
        )
      )
    `;
  }

  private async findProposedItems(
    tradeProposalIds: string[],
  ): Promise<ProposedItemRow[]> {
    if (tradeProposalIds.length === 0) {
      return [];
    }

    const rawRows: unknown = await this.dataSource.query(
      `
        SELECT
          tpi."trade_proposal_id" AS "trade_proposal_id",
          pl."id" AS "proposed_listing_id",
          lp."public_url" AS "proposed_photo",
          g."category" AS "proposed_category",
          g."size" AS "proposed_size"
        FROM "trade_proposal_items" tpi
        INNER JOIN "listings" pl ON pl."id" = tpi."proposed_listing_id"
        INNER JOIN "garments" g ON g."id" = pl."garment_id"
        LEFT JOIN "listing_photos" lp ON lp."id" = pl."dominant_photo_id"
        WHERE tpi."trade_proposal_id" = ANY($1::uuid[])
        ORDER BY tpi."created_at" ASC
      `,
      [tradeProposalIds],
    );

    return rawRows as ProposedItemRow[];
  }
}

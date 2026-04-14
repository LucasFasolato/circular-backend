import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ListingAvailabilitySignals {
  isSaved: boolean;
  hasActivePurchaseIntent: boolean;
  hasActiveTradeProposal: boolean;
  hasActiveMatch: boolean;
  isCommittedProposedItem: boolean;
}

interface BooleanRow {
  value: unknown;
}

@Injectable()
export class ListingAvailabilityReadRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getSignals(
    listingId: string,
    viewerUserId?: string,
  ): Promise<ListingAvailabilitySignals> {
    const purchaseIntentParams: unknown[] = [listingId];
    const tradeProposalParams: unknown[] = [listingId];
    const savedParams: unknown[] = [listingId];

    const hasActivePurchaseIntentQuery = viewerUserId
      ? `EXISTS (
          SELECT 1
          FROM "purchase_intents" pi
          WHERE pi."listing_id" = $1
            AND pi."buyer_user_id" = $2
            AND pi."state" = 'ACTIVE'
        )`
      : 'FALSE';
    const hasActiveTradeProposalQuery = viewerUserId
      ? `EXISTS (
          SELECT 1
          FROM "trade_proposals" tp
          WHERE tp."target_listing_id" = $1
            AND tp."proposer_user_id" = $2
            AND tp."state" = 'ACTIVE'
        )`
      : 'FALSE';
    const isSavedQuery = viewerUserId
      ? `EXISTS (
          SELECT 1
          FROM "saved_listings" sl
          WHERE sl."listing_id" = $1
            AND sl."user_id" = $2
        )`
      : 'FALSE';

    if (viewerUserId) {
      purchaseIntentParams.push(viewerUserId);
      tradeProposalParams.push(viewerUserId);
      savedParams.push(viewerUserId);
    }

    const results = (await Promise.all([
      this.dataSource.query(
        `SELECT ${hasActivePurchaseIntentQuery} AS "value"`,
        purchaseIntentParams,
      ),
      this.dataSource.query(
        `SELECT ${hasActiveTradeProposalQuery} AS "value"`,
        tradeProposalParams,
      ),
      this.dataSource.query(`SELECT ${isSavedQuery} AS "value"`, savedParams),
      this.dataSource.query(
        `
            SELECT EXISTS (
              SELECT 1
              FROM "match_sessions" ms
              WHERE ms."listing_id" = $1
                AND ms."state" IN ('OPEN', 'ACTIVE')
            ) AS "value"
          `,
        [listingId],
      ),
      this.dataSource.query(
        `
            SELECT EXISTS (
              SELECT 1
              FROM "proposed_listing_commitments" plc
              WHERE plc."proposed_listing_id" = $1
                AND plc."state" IN ('RESERVED_FOR_PROPOSAL', 'COMMITTED_TO_MATCH')
            ) AS "value"
          `,
        [listingId],
      ),
    ])) as [
      BooleanRow[],
      BooleanRow[],
      BooleanRow[],
      BooleanRow[],
      BooleanRow[],
    ];
    const [
      purchaseIntentRows,
      tradeProposalRows,
      savedRows,
      activeMatchRows,
      commitmentRows,
    ] = results;

    return {
      isSaved: this.toBoolean(savedRows[0]?.value),
      hasActivePurchaseIntent: this.toBoolean(purchaseIntentRows[0]?.value),
      hasActiveTradeProposal: this.toBoolean(tradeProposalRows[0]?.value),
      hasActiveMatch: this.toBoolean(activeMatchRows[0]?.value),
      isCommittedProposedItem: this.toBoolean(commitmentRows[0]?.value),
    };
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  }
}

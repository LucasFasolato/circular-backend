import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SavedListingEntity } from '../../listings/domain/saved-listing.entity';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { DiscoveryFeedMode } from '../domain/discovery-feed-mode.enum';
import { FeedDismissalEntity } from '../domain/feed-dismissal.entity';
import { ListingEntity } from '../../listings/domain/listing.entity';
import { ImageAuditStatus } from '../../listings/domain/image-audit-status.enum';

export interface DiscoveryFeedCursor {
  publishedAt: string;
  id: string;
}

export interface SavedListingsCursor {
  savedAt: string;
  saveId: string;
}

export interface DiscoveryFeedQuery {
  viewerUserId: string;
  limit: number;
  category?: string;
  size?: string;
  city?: string;
  zone?: string;
  mode?: DiscoveryFeedMode;
  cursor?: DiscoveryFeedCursor;
}

export interface SavedListingsQuery {
  viewerUserId: string;
  limit: number;
  cursor?: SavedListingsCursor;
}

export interface DiscoveryListingSnapshot {
  id: string;
  state: string;
  category: string;
  subcategory: string | null;
  size: string;
  qualityScore: number | null;
  approvedOrPendingPhotoCount: number;
  allowsPurchase: boolean;
  allowsTrade: boolean;
  price: number | null;
  city: string;
  zone: string | null;
  photoUrl: string | null;
  publishedAt: string;
  isSaved: boolean;
  isDismissed: boolean;
}

export interface SavedDiscoveryListingSnapshot extends DiscoveryListingSnapshot {
  savedAt: string;
  saveId: string;
}

interface DiscoveryFeedRow {
  listing_id: string;
  listing_state: string;
  garment_category: string;
  garment_subcategory: string | null;
  garment_size: string;
  listing_quality_score: number | null;
  approved_or_pending_photo_count: string;
  listing_allows_purchase: boolean;
  listing_allows_trade: boolean;
  listing_price_amount: number | null;
  listing_city: string;
  listing_zone: string | null;
  photo_public_url: string | null;
  listing_published_at: Date;
  is_saved: boolean;
  is_dismissed: boolean;
}

interface SavedDiscoveryFeedRow extends DiscoveryFeedRow {
  saved_created_at: Date;
  saved_id: string;
}

@Injectable()
export class DiscoveryFeedRepository {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly listingsRepo: Repository<ListingEntity>,
    @InjectRepository(SavedListingEntity)
    private readonly savedListingsRepo: Repository<SavedListingEntity>,
  ) {}

  async findFeedPage(
    query: DiscoveryFeedQuery,
  ): Promise<DiscoveryListingSnapshot[]> {
    const qb = this.listingsRepo
      .createQueryBuilder('listing')
      .innerJoin('listing.garment', 'garment')
      .leftJoin('listing.dominantPhoto', 'dominantPhoto')
      .leftJoin(
        SavedListingEntity,
        'savedLookup',
        'savedLookup.listing_id = listing.id AND savedLookup.user_id = :viewerUserId',
        { viewerUserId: query.viewerUserId },
      )
      .leftJoin(
        FeedDismissalEntity,
        'dismissal',
        'dismissal.listing_id = listing.id AND dismissal.user_id = :viewerUserId',
        { viewerUserId: query.viewerUserId },
      )
      .leftJoin('listing.photos', 'photo')
      .select('listing.id', 'listing_id')
      .addSelect('listing.state', 'listing_state')
      .addSelect('garment.category', 'garment_category')
      .addSelect('garment.subcategory', 'garment_subcategory')
      .addSelect('garment.size', 'garment_size')
      .addSelect('listing.quality_score', 'listing_quality_score')
      .addSelect('listing.allows_purchase', 'listing_allows_purchase')
      .addSelect('listing.allows_trade', 'listing_allows_trade')
      .addSelect('listing.price_amount', 'listing_price_amount')
      .addSelect('listing.city', 'listing_city')
      .addSelect('listing.zone', 'listing_zone')
      .addSelect('dominantPhoto.public_url', 'photo_public_url')
      .addSelect('listing.published_at', 'listing_published_at')
      .addSelect(
        'COUNT(CASE WHEN photo.audit_status IN (:...goodStatuses) THEN 1 END)',
        'approved_or_pending_photo_count',
      )
      .addSelect(
        'CASE WHEN savedLookup.id IS NULL THEN FALSE ELSE TRUE END',
        'is_saved',
      )
      .addSelect(
        'CASE WHEN dismissal.id IS NULL THEN FALSE ELSE TRUE END',
        'is_dismissed',
      )
      .setParameter('goodStatuses', [
        ImageAuditStatus.APPROVED,
        ImageAuditStatus.PENDING,
      ])
      .where('listing.state = :publishedState', {
        publishedState: ListingState.PUBLISHED,
      })
      .andWhere('listing.archived_at IS NULL')
      .andWhere('listing.published_at IS NOT NULL')
      .andWhere('listing.owner_user_id <> :viewerUserId', {
        viewerUserId: query.viewerUserId,
      })
      .andWhere('dismissal.id IS NULL')
      .groupBy('listing.id')
      .addGroupBy('listing.state')
      .addGroupBy('garment.category')
      .addGroupBy('garment.subcategory')
      .addGroupBy('garment.size')
      .addGroupBy('listing.quality_score')
      .addGroupBy('listing.allows_purchase')
      .addGroupBy('listing.allows_trade')
      .addGroupBy('listing.price_amount')
      .addGroupBy('listing.city')
      .addGroupBy('listing.zone')
      .addGroupBy('dominantPhoto.public_url')
      .addGroupBy('listing.published_at')
      .addGroupBy('savedLookup.id')
      .addGroupBy('dismissal.id')
      .orderBy('listing.published_at', 'DESC')
      .addOrderBy('listing.id', 'DESC')
      .take(query.limit);

    this.applyFilters(qb, query);
    this.applyFeedCursor(qb, query.cursor);

    const rows = await qb.getRawMany<DiscoveryFeedRow>();
    return rows.map((row) => this.mapDiscoveryRow(row));
  }

  async findSavedPage(
    query: SavedListingsQuery,
  ): Promise<SavedDiscoveryListingSnapshot[]> {
    const qb = this.savedListingsRepo
      .createQueryBuilder('savedListing')
      .innerJoin(
        ListingEntity,
        'listing',
        'listing.id = savedListing.listing_id',
      )
      .innerJoin('listing.garment', 'garment')
      .leftJoin('listing.dominantPhoto', 'dominantPhoto')
      .leftJoin(
        FeedDismissalEntity,
        'dismissal',
        'dismissal.listing_id = listing.id AND dismissal.user_id = :viewerUserId',
        { viewerUserId: query.viewerUserId },
      )
      .leftJoin('listing.photos', 'photo')
      .select('listing.id', 'listing_id')
      .addSelect('listing.state', 'listing_state')
      .addSelect('garment.category', 'garment_category')
      .addSelect('garment.subcategory', 'garment_subcategory')
      .addSelect('garment.size', 'garment_size')
      .addSelect('listing.quality_score', 'listing_quality_score')
      .addSelect('listing.allows_purchase', 'listing_allows_purchase')
      .addSelect('listing.allows_trade', 'listing_allows_trade')
      .addSelect('listing.price_amount', 'listing_price_amount')
      .addSelect('listing.city', 'listing_city')
      .addSelect('listing.zone', 'listing_zone')
      .addSelect('dominantPhoto.public_url', 'photo_public_url')
      .addSelect('listing.published_at', 'listing_published_at')
      .addSelect('savedListing.created_at', 'saved_created_at')
      .addSelect('savedListing.id', 'saved_id')
      .addSelect(
        'COUNT(CASE WHEN photo.audit_status IN (:...goodStatuses) THEN 1 END)',
        'approved_or_pending_photo_count',
      )
      .addSelect('TRUE', 'is_saved')
      .addSelect(
        'CASE WHEN dismissal.id IS NULL THEN FALSE ELSE TRUE END',
        'is_dismissed',
      )
      .setParameter('goodStatuses', [
        ImageAuditStatus.APPROVED,
        ImageAuditStatus.PENDING,
      ])
      .where('savedListing.user_id = :viewerUserId', {
        viewerUserId: query.viewerUserId,
      })
      .andWhere('listing.state = :publishedState', {
        publishedState: ListingState.PUBLISHED,
      })
      .andWhere('listing.archived_at IS NULL')
      .andWhere('listing.published_at IS NOT NULL')
      .andWhere('listing.owner_user_id <> :viewerUserId', {
        viewerUserId: query.viewerUserId,
      })
      .groupBy('listing.id')
      .addGroupBy('listing.state')
      .addGroupBy('garment.category')
      .addGroupBy('garment.subcategory')
      .addGroupBy('garment.size')
      .addGroupBy('listing.quality_score')
      .addGroupBy('listing.allows_purchase')
      .addGroupBy('listing.allows_trade')
      .addGroupBy('listing.price_amount')
      .addGroupBy('listing.city')
      .addGroupBy('listing.zone')
      .addGroupBy('dominantPhoto.public_url')
      .addGroupBy('listing.published_at')
      .addGroupBy('savedListing.created_at')
      .addGroupBy('savedListing.id')
      .addGroupBy('dismissal.id')
      .orderBy('savedListing.created_at', 'DESC')
      .addOrderBy('savedListing.id', 'DESC')
      .take(query.limit);

    this.applySavedCursor(qb, query.cursor);

    const rows = await qb.getRawMany<SavedDiscoveryFeedRow>();
    return rows.map((row) => ({
      ...this.mapDiscoveryRow(row),
      savedAt: row.saved_created_at.toISOString(),
      saveId: row.saved_id,
    }));
  }

  private applyFilters(
    qb: ReturnType<Repository<ListingEntity>['createQueryBuilder']>,
    query: DiscoveryFeedQuery,
  ): void {
    if (query.category) {
      qb.andWhere('garment.category = :category', { category: query.category });
    }

    if (query.size) {
      qb.andWhere('garment.size = :size', { size: query.size });
    }

    if (query.city) {
      qb.andWhere('listing.city = :city', { city: query.city });
    }

    if (query.zone) {
      qb.andWhere('listing.zone = :zone', { zone: query.zone });
    }

    if (query.mode === DiscoveryFeedMode.PURCHASE) {
      qb.andWhere('listing.allows_purchase = TRUE').andWhere(
        'listing.allows_trade = FALSE',
      );
    }

    if (query.mode === DiscoveryFeedMode.TRADE) {
      qb.andWhere('listing.allows_purchase = FALSE').andWhere(
        'listing.allows_trade = TRUE',
      );
    }

    if (query.mode === DiscoveryFeedMode.BOTH) {
      qb.andWhere('listing.allows_purchase = TRUE').andWhere(
        'listing.allows_trade = TRUE',
      );
    }
  }

  private applyFeedCursor(
    qb: ReturnType<Repository<ListingEntity>['createQueryBuilder']>,
    cursor?: DiscoveryFeedCursor,
  ): void {
    if (!cursor) {
      return;
    }

    qb.andWhere(
      new Brackets((where) => {
        where
          .where('listing.published_at < :cursorPublishedAt', {
            cursorPublishedAt: cursor.publishedAt,
          })
          .orWhere(
            'listing.published_at = :cursorPublishedAt AND listing.id < :cursorId',
            {
              cursorPublishedAt: cursor.publishedAt,
              cursorId: cursor.id,
            },
          );
      }),
    );
  }

  private applySavedCursor(
    qb: ReturnType<Repository<SavedListingEntity>['createQueryBuilder']>,
    cursor?: SavedListingsCursor,
  ): void {
    if (!cursor) {
      return;
    }

    qb.andWhere(
      new Brackets((where) => {
        where
          .where('savedListing.created_at < :cursorSavedAt', {
            cursorSavedAt: cursor.savedAt,
          })
          .orWhere(
            'savedListing.created_at = :cursorSavedAt AND savedListing.id < :cursorSaveId',
            {
              cursorSavedAt: cursor.savedAt,
              cursorSaveId: cursor.saveId,
            },
          );
      }),
    );
  }

  private mapDiscoveryRow(row: DiscoveryFeedRow): DiscoveryListingSnapshot {
    return {
      id: row.listing_id,
      state: row.listing_state,
      category: row.garment_category,
      subcategory: row.garment_subcategory,
      size: row.garment_size,
      qualityScore:
        row.listing_quality_score === null
          ? null
          : Number(row.listing_quality_score),
      approvedOrPendingPhotoCount: Number(
        row.approved_or_pending_photo_count ?? 0,
      ),
      allowsPurchase: this.toBoolean(row.listing_allows_purchase),
      allowsTrade: this.toBoolean(row.listing_allows_trade),
      price:
        row.listing_price_amount === null
          ? null
          : Number(row.listing_price_amount),
      city: row.listing_city,
      zone: row.listing_zone,
      photoUrl: row.photo_public_url,
      publishedAt: row.listing_published_at.toISOString(),
      isSaved: this.toBoolean(row.is_saved),
      isDismissed: this.toBoolean(row.is_dismissed),
    };
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
  }
}

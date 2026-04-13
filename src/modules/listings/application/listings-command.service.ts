import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { CreateListingDto } from '../presentation/dto/create-listing.dto';
import { UpdateListingDto } from '../presentation/dto/update-listing.dto';
import { ListingQueryService } from './listing-query.service';
import { GarmentRepository } from '../infrastructure/garment.repository';
import { ListingRepository } from '../infrastructure/listing.repository';
import { ListingTradePreferenceRepository } from '../infrastructure/listing-trade-preference.repository';
import { ListingPhotoRepository } from '../infrastructure/listing-photo.repository';
import {
  LocalListingPhotoStorageService,
  UploadedPhotoFile,
} from '../infrastructure/local-listing-photo-storage.service';
import { UserRepository } from '../../auth/infrastructure/user.repository';
import { ListingDetailResponseDto } from '../presentation/dto/listing-response.dto';
import {
  canArchiveListing,
  canEditListing,
  canPauseListing,
  canResumeListing,
  canSubmitListingForReview,
} from '../domain/listing-state.policy';
import { ListingState } from '../domain/listing-state.enum';
import { CurrencyCode } from '../domain/currency-code.enum';
import { ListingEntity } from '../domain/listing.entity';
import { CommercialConfigInputDto } from '../presentation/dto/commercial-config-input.dto';
import { TradePreferencesInputDto } from '../presentation/dto/trade-preferences-input.dto';
import { LISTING_LIMITS } from '../domain/listing-limits.constants';
import {
  isValidSizeForCategory,
  isValidSubcategory,
} from '../domain/listing-catalog.policy';
import { ImageAuditStatus } from '../domain/image-audit-status.enum';

@Injectable()
export class ListingsCommandService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly garmentRepository: GarmentRepository,
    private readonly listingRepository: ListingRepository,
    private readonly listingTradePreferenceRepository: ListingTradePreferenceRepository,
    private readonly listingPhotoRepository: ListingPhotoRepository,
    private readonly localListingPhotoStorageService: LocalListingPhotoStorageService,
    private readonly listingQueryService: ListingQueryService,
  ) {}

  async createDraft(
    ownerUserId: string,
    dto: CreateListingDto,
  ): Promise<ListingDetailResponseDto> {
    await this.ensureOwnerExists(ownerUserId);
    this.validateGarment(
      dto.garment.category,
      dto.garment.subcategory ?? null,
      dto.garment.size,
    );
    this.validateCommercialConfig(dto.commercialConfig);

    const activeListingsCount =
      await this.listingRepository.countActiveOwnedByUser(ownerUserId);

    if (activeListingsCount >= LISTING_LIMITS.MAX_ACTIVE_LISTINGS_PER_USER) {
      throw new ValidationAppError('Active listing limit reached', [
        {
          field: 'listing',
          message: `A user can have at most ${LISTING_LIMITS.MAX_ACTIVE_LISTINGS_PER_USER} active listings`,
        },
      ]);
    }

    const listingId = await this.dataSource.transaction(async (manager) => {
      const garment = await this.garmentRepository.create(
        {
          ownerUserId,
          category: dto.garment.category,
          subcategory: dto.garment.subcategory ?? null,
          size: dto.garment.size,
          condition: dto.garment.condition,
          brand: dto.garment.brand ?? null,
          color: dto.garment.color ?? null,
          material: dto.garment.material ?? null,
        },
        manager,
      );

      const listing = await this.listingRepository.create(
        {
          ownerUserId,
          garmentId: garment.id,
          state: ListingState.DRAFT,
          description: dto.description ?? null,
          allowsPurchase: dto.commercialConfig.allowsPurchase,
          allowsTrade: dto.commercialConfig.allowsTrade,
          priceAmount:
            dto.commercialConfig.allowsPurchase &&
            dto.commercialConfig.price !== undefined
              ? dto.commercialConfig.price
              : null,
          currencyCode: CurrencyCode.ARS,
          city: dto.location.city,
          zone: dto.location.zone ?? null,
          qualityScore: null,
          dominantPhotoId: null,
          reservationExpiresAt: null,
          publishedAt: null,
          closedAt: null,
          archivedAt: null,
        },
        manager,
      );

      await this.syncTradePreferences(
        listing.id,
        dto.commercialConfig.allowsTrade,
        dto.commercialConfig.tradePreferences,
        manager,
      );

      return listing.id;
    });

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async addPhotos(
    ownerUserId: string,
    listingId: string,
    files: UploadedPhotoFile[],
  ): Promise<ListingDetailResponseDto> {
    if (files.length === 0) {
      throw new ValidationAppError('At least one photo is required', [
        { field: 'photos', message: 'Upload at least one photo' },
      ]);
    }

    const listing = await this.getOwnedListing(listingId, ownerUserId);

    if (!canEditListing(listing.state as ListingState)) {
      throw new ValidationAppError(
        'Listing cannot accept photos in current state',
        [
          {
            field: 'state',
            message: 'Only DRAFT or OBSERVED listings can receive photos',
          },
        ],
      );
    }

    const existingPhotoCount = listing.photos.length;
    if (
      existingPhotoCount + files.length >
      LISTING_LIMITS.MAX_PHOTOS_PER_LISTING
    ) {
      throw new ValidationAppError('Photo count limit exceeded', [
        {
          field: 'photos',
          message: `A listing can have at most ${LISTING_LIMITS.MAX_PHOTOS_PER_LISTING} photos`,
        },
      ]);
    }

    const storedPhotos = await Promise.all(
      files.map((file) =>
        this.localListingPhotoStorageService.storePhoto(listingId, file),
      ),
    );

    await this.dataSource.transaction(async (manager) => {
      const persistedPhotos = await this.listingPhotoRepository.createMany(
        storedPhotos.map((photo, index) => ({
          listingId,
          objectKey: photo.objectKey,
          publicUrl: photo.publicUrl,
          mimeType: photo.mimeType,
          sizeBytes: photo.sizeBytes,
          width: photo.width,
          height: photo.height,
          position: existingPhotoCount + index + 1,
          auditStatus: ImageAuditStatus.PENDING,
        })),
        manager,
      );

      if (!listing.dominantPhotoId && persistedPhotos.length > 0) {
        listing.dominantPhotoId = persistedPhotos[0].id;
        await this.listingRepository.save(listing, manager);
      }
    });

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async update(
    ownerUserId: string,
    listingId: string,
    dto: UpdateListingDto,
  ): Promise<ListingDetailResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const listing = await this.getOwnedListing(listingId, ownerUserId);

      if (!canEditListing(listing.state as ListingState)) {
        throw new ValidationAppError('Listing is not editable', [
          {
            field: 'state',
            message: 'Only DRAFT or OBSERVED listings can be edited',
          },
        ]);
      }

      const garment = listing.garment;
      const mergedCategory = dto.garment?.category ?? garment.category;
      const mergedSubcategory =
        dto.garment?.subcategory !== undefined
          ? (dto.garment.subcategory ?? null)
          : garment.subcategory;
      const mergedSize = dto.garment?.size ?? garment.size;

      this.validateGarment(mergedCategory, mergedSubcategory, mergedSize);

      if (dto.garment) {
        garment.category = mergedCategory;
        garment.subcategory = mergedSubcategory;
        garment.size = mergedSize;
        garment.condition = dto.garment.condition ?? garment.condition;
        garment.brand =
          dto.garment.brand !== undefined
            ? (dto.garment.brand ?? null)
            : garment.brand;
        garment.color =
          dto.garment.color !== undefined
            ? (dto.garment.color ?? null)
            : garment.color;
        garment.material =
          dto.garment.material !== undefined
            ? (dto.garment.material ?? null)
            : garment.material;
      }

      const currentTradePreferences =
        await this.listingTradePreferenceRepository.findByListingId(
          listingId,
          manager,
        );
      const effectiveCommercialConfig = this.buildEffectiveCommercialConfig(
        listing,
        currentTradePreferences
          ? {
              desiredCategories: currentTradePreferences.desiredCategories,
              desiredSizes: currentTradePreferences.desiredSizes,
              notes: currentTradePreferences.notes,
            }
          : null,
        dto.commercialConfig,
      );
      this.validateCommercialConfig(effectiveCommercialConfig);

      listing.allowsPurchase = effectiveCommercialConfig.allowsPurchase;
      listing.allowsTrade = effectiveCommercialConfig.allowsTrade;
      listing.priceAmount = effectiveCommercialConfig.allowsPurchase
        ? (effectiveCommercialConfig.price ?? null)
        : null;

      if (dto.description !== undefined) {
        listing.description = dto.description ?? null;
      }

      if (dto.location) {
        listing.city = dto.location.city;
        listing.zone =
          dto.location.zone !== undefined
            ? (dto.location.zone ?? null)
            : listing.zone;
      }

      await this.garmentRepository.save(garment, manager);
      await this.listingRepository.save(listing, manager);
      await this.syncTradePreferences(
        listingId,
        effectiveCommercialConfig.allowsTrade,
        effectiveCommercialConfig.tradePreferences,
        manager,
      );
    });

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async submitReview(
    ownerUserId: string,
    listingId: string,
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.getOwnedListing(listingId, ownerUserId);

    if (!canSubmitListingForReview(listing.state as ListingState)) {
      throw new ValidationAppError('Listing cannot be submitted for review', [
        {
          field: 'state',
          message: 'Only DRAFT or OBSERVED listings can be submitted',
        },
      ]);
    }

    if (listing.photos.length < LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT) {
      throw new ValidationAppError('Listing needs more photos', [
        {
          field: 'photos',
          message: `At least ${LISTING_LIMITS.MIN_PHOTOS_TO_SUBMIT} photos are required`,
        },
      ]);
    }

    listing.state = ListingState.IN_REVIEW;
    await this.listingRepository.save(listing);

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async pause(
    ownerUserId: string,
    listingId: string,
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.getOwnedListing(listingId, ownerUserId);

    if (!canPauseListing(listing.state as ListingState)) {
      throw new ValidationAppError('Listing cannot be paused', [
        { field: 'state', message: 'Only PUBLISHED listings can be paused' },
      ]);
    }

    listing.state = ListingState.PAUSED;
    await this.listingRepository.save(listing);

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async resume(
    ownerUserId: string,
    listingId: string,
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.getOwnedListing(listingId, ownerUserId);

    if (!canResumeListing(listing.state as ListingState)) {
      throw new ValidationAppError('Listing cannot be resumed', [
        { field: 'state', message: 'Only PAUSED listings can be resumed' },
      ]);
    }

    listing.state = ListingState.PUBLISHED;
    await this.listingRepository.save(listing);

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  async archive(
    ownerUserId: string,
    listingId: string,
  ): Promise<ListingDetailResponseDto> {
    const listing = await this.getOwnedListing(listingId, ownerUserId);

    if (!canArchiveListing(listing.state as ListingState)) {
      throw new ValidationAppError('Listing cannot be archived', [
        { field: 'state', message: 'Listing is already archived' },
      ]);
    }

    listing.state = ListingState.ARCHIVED;
    listing.archivedAt = new Date();
    await this.listingRepository.save(listing);

    return this.listingQueryService.getById(listingId, ownerUserId);
  }

  private async ensureOwnerExists(ownerUserId: string): Promise<void> {
    const user = await this.userRepository.findById(ownerUserId);

    if (!user) {
      throw new NotFoundError('User not found');
    }
  }

  private async getOwnedListing(
    listingId: string,
    ownerUserId: string,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findById(listingId);

    if (!listing) {
      throw new NotFoundError('Listing not found');
    }

    if (listing.ownerUserId !== ownerUserId) {
      throw new ForbiddenError('You can only modify your own listings');
    }

    return listing;
  }

  private validateGarment(
    category: string,
    subcategory: string | null,
    size: string,
  ): void {
    if (!isValidSubcategory(category as never, subcategory)) {
      throw new ValidationAppError('Invalid subcategory for category', [
        {
          field: 'garment.subcategory',
          message: 'subcategory must belong to the selected category',
        },
      ]);
    }

    if (!isValidSizeForCategory(category as never, size as never)) {
      throw new ValidationAppError('Invalid size for category', [
        {
          field: 'garment.size',
          message: 'size is not compatible with the selected category',
        },
      ]);
    }
  }

  private validateCommercialConfig(input: CommercialConfigInputDto): void {
    if (!input.allowsPurchase && !input.allowsTrade) {
      throw new ValidationAppError('Invalid commercial configuration', [
        {
          field: 'commercialConfig',
          message: 'At least one of allowsPurchase or allowsTrade must be true',
        },
      ]);
    }

    if (input.allowsPurchase && input.price === undefined) {
      throw new ValidationAppError(
        'Price is required when purchase is enabled',
        [
          {
            field: 'commercialConfig.price',
            message: 'price is required when allowsPurchase is true',
          },
        ],
      );
    }

    if (
      !input.allowsPurchase &&
      input.price !== undefined &&
      input.price !== null
    ) {
      throw new ValidationAppError(
        'Price is only allowed for purchasable listings',
        [
          {
            field: 'commercialConfig.price',
            message: 'price must be null when allowsPurchase is false',
          },
        ],
      );
    }

    if (!input.allowsTrade && input.tradePreferences) {
      throw new ValidationAppError('Trade preferences require trade enabled', [
        {
          field: 'commercialConfig.tradePreferences',
          message: 'tradePreferences require allowsTrade to be true',
        },
      ]);
    }
  }

  private async syncTradePreferences(
    listingId: string,
    allowsTrade: boolean,
    tradePreferences: TradePreferencesInputDto | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!allowsTrade) {
      await this.listingTradePreferenceRepository.deleteByListingId(
        listingId,
        manager,
      );
      return;
    }

    const existing =
      await this.listingTradePreferenceRepository.findByListingId(
        listingId,
        manager,
      );

    if (existing) {
      existing.desiredCategories = tradePreferences?.desiredCategories ?? [];
      existing.desiredSizes = tradePreferences?.desiredSizes ?? [];
      existing.notes = tradePreferences?.notes ?? null;
      await this.listingTradePreferenceRepository.save(existing, manager);
      return;
    }

    await this.listingTradePreferenceRepository.create(
      {
        listingId,
        desiredCategories: tradePreferences?.desiredCategories ?? [],
        desiredSizes: tradePreferences?.desiredSizes ?? [],
        notes: tradePreferences?.notes ?? null,
      },
      manager,
    );
  }

  private buildEffectiveCommercialConfig(
    listing: ListingEntity,
    tradePreferences: {
      desiredCategories: string[];
      desiredSizes: string[];
      notes: string | null;
    } | null,
    patch?: CommercialConfigInputDto,
  ): CommercialConfigInputDto {
    return {
      allowsPurchase: patch?.allowsPurchase ?? listing.allowsPurchase,
      allowsTrade: patch?.allowsTrade ?? listing.allowsTrade,
      price: patch?.price !== undefined ? patch.price : listing.priceAmount,
      tradePreferences:
        patch?.tradePreferences !== undefined
          ? patch.tradePreferences
          : tradePreferences
            ? {
                desiredCategories: tradePreferences.desiredCategories as never,
                desiredSizes: tradePreferences.desiredSizes as never,
                notes: tradePreferences.notes,
              }
            : undefined,
    };
  }
}

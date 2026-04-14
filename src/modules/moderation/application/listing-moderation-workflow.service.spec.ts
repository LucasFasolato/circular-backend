import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ImageAuditStatus } from '../../listings/domain/image-audit-status.enum';
import { ListingState } from '../../listings/domain/listing-state.enum';
import { ListingPhotoRepository } from '../../listings/infrastructure/listing-photo.repository';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { ListingModerationWorkflowService } from './listing-moderation-workflow.service';
import { ImageAuditRepository } from '../infrastructure/image-audit.repository';
import { ModerationReviewRepository } from '../infrastructure/moderation-review.repository';

describe('ListingModerationWorkflowService notifications', () => {
  function createService(listingOverrides?: Record<string, unknown>) {
    const listing = {
      id: 'lst-1',
      ownerUserId: 'usr-owner',
      state: ListingState.DRAFT,
      description:
        'Descripción suficientemente larga para no generar observaciones.',
      garment: {
        brand: 'CirculAR',
        color: 'Blue',
        material: 'Cotton',
        subcategory: 'HOODIE',
      },
      photos: [
        {
          id: 'pho-1',
          objectKey: 'obj-1',
          publicUrl: 'https://cdn/1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 111111,
          width: 1000,
          height: 1200,
          auditStatus: ImageAuditStatus.APPROVED,
        },
        {
          id: 'pho-2',
          objectKey: 'obj-2',
          publicUrl: 'https://cdn/2.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 111112,
          width: 1001,
          height: 1200,
          auditStatus: ImageAuditStatus.APPROVED,
        },
      ],
      ...listingOverrides,
    };
    const transaction = jest.fn((cb: (manager: object) => unknown) => cb({}));
    const listingRepository = {
      findById: jest.fn().mockResolvedValue(listing),
      findByIdWithManager: jest.fn().mockResolvedValue(listing),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as ListingRepository;
    const listingPhotoRepository = {
      saveMany: jest.fn().mockResolvedValue(undefined),
    } as unknown as ListingPhotoRepository;
    const moderationReviewRepository = {
      findLatestRelevantByListingId: jest.fn().mockResolvedValue(null),
      findLatestByListingId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        id: 'rev-1',
        state: 'PENDING',
        reasons: [],
        providerSummary: null,
      }),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as ModerationReviewRepository;
    const imageAuditRepository = {
      createMany: jest.fn().mockResolvedValue(undefined),
    } as unknown as ImageAuditRepository;
    const imageModerationProvider = {
      auditImage: jest.fn().mockResolvedValue({
        status: ImageAuditStatus.APPROVED,
        reasons: [],
        providerName: 'stub',
        providerPayload: null,
        auditedAt: new Date('2026-04-14T12:00:00.000Z'),
      }),
    };
    const notifyListingObserved = jest.fn().mockResolvedValue(undefined);
    const notifyListingRejected = jest.fn().mockResolvedValue(undefined);
    const notificationCommandService = {
      notifyListingObserved,
      notifyListingRejected,
    } as unknown as NotificationCommandService;

    return {
      service: new ListingModerationWorkflowService(
        { transaction } as never,
        listingRepository,
        listingPhotoRepository,
        moderationReviewRepository,
        imageAuditRepository,
        notificationCommandService,
        imageModerationProvider as never,
      ),
      notifyListingObserved,
      notifyListingRejected,
    };
  }

  it('creates an observed notification when moderation leaves the listing observed', async () => {
    const { service, notifyListingObserved } = createService({
      description: 'Muy corta',
    });

    const result = await service.submitForReview('usr-owner', 'lst-1');
    const [payload] = notifyListingObserved.mock.calls[0] as [
      {
        userId: string;
        listingId: string;
        moderationReasons: string[];
      },
      object,
    ];

    expect(result).toBe(ListingState.OBSERVED);
    expect(payload.userId).toBe('usr-owner');
    expect(payload.listingId).toBe('lst-1');
    expect(payload.moderationReasons).toContain('MISSING_REQUIRED_DATA');
  });

  it('creates a rejected notification when moderation rejects the listing', async () => {
    const { service, notifyListingRejected } = createService({
      description:
        'Esta publicación menciona weapon y debe quedar rechazada por contenido.',
    });

    const result = await service.submitForReview('usr-owner', 'lst-1');
    const [payload] = notifyListingRejected.mock.calls[0] as [
      {
        userId: string;
        listingId: string;
        moderationReasons: string[];
      },
      object,
    ];

    expect(result).toBe(ListingState.REJECTED);
    expect(payload.userId).toBe('usr-owner');
    expect(payload.listingId).toBe('lst-1');
    expect(payload.moderationReasons).toContain('PHOTO_CONTENT_NOT_ALLOWED');
  });
});

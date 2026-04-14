import { NotificationCommandService } from '../../notifications/application/notification-command.service';
import { ListingRepository } from '../../listings/infrastructure/listing.repository';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { RejectPurchaseIntentService } from './reject-purchase-intent.service';
import { InteractionResponseFactory } from './interaction-response.factory';

describe('RejectPurchaseIntentService', () => {
  it('rejects an active purchase intent and notifies the interested user', async () => {
    const purchaseIntent = {
      id: 'pi-1',
      listingId: 'lst-1',
      listingOwnerUserId: 'usr-owner',
      buyerUserId: 'usr-buyer',
      state: PurchaseIntentState.ACTIVE,
      rejectedAt: null,
      resolvedByUserId: null,
    };
    const listing = {
      id: 'lst-1',
      state: 'PUBLISHED',
      reservationExpiresAt: null,
    };
    const dataSource = {
      transaction: jest.fn((cb: (manager: object) => unknown) => cb({})),
    };
    const purchaseIntentRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(purchaseIntent),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    } as unknown as PurchaseIntentRepository;
    const listingRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(listing),
    } as unknown as ListingRepository;
    const notifyInteractionRejected = jest.fn().mockResolvedValue(undefined);
    const notificationCommandService = {
      notifyInteractionRejected,
    } as unknown as NotificationCommandService;

    const service = new RejectPurchaseIntentService(
      dataSource as never,
      purchaseIntentRepository,
      listingRepository,
      new InteractionResponseFactory(),
      notificationCommandService,
    );

    const result = await service.execute('usr-owner', 'pi-1');

    expect(purchaseIntent.state).toBe(PurchaseIntentState.REJECTED);
    expect(notifyInteractionRejected).toHaveBeenCalledWith(
      {
        userId: 'usr-buyer',
        listingId: 'lst-1',
        interactionId: 'pi-1',
        interactionType: 'PURCHASE_INTENT',
      },
      expect.any(Object),
    );
    expect(result.state).toBe(PurchaseIntentState.REJECTED);
  });
});

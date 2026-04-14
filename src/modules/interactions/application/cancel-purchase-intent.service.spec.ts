import { ForbiddenError } from '../../../common/errors/forbidden.error';
import { CancelPurchaseIntentService } from './cancel-purchase-intent.service';
import { PurchaseIntentState } from '../domain/purchase-intent-state.enum';
import { PurchaseIntentRepository } from '../infrastructure/purchase-intent.repository';
import { InteractionResponseFactory } from './interaction-response.factory';

describe('CancelPurchaseIntentService', () => {
  it('fails when another user tries to cancel the purchase intent', async () => {
    const purchaseIntent = {
      id: 'pi-1',
      listingId: 'lst-1',
      buyerUserId: 'usr-buyer',
      state: PurchaseIntentState.ACTIVE,
      createdAt: new Date('2026-04-13T12:00:00.000Z'),
    };
    const service = new CancelPurchaseIntentService(
      {
        transaction: jest.fn((cb: (manager: object) => unknown) => cb({})),
      } as never,
      {
        findByIdForUpdate: jest.fn().mockResolvedValue(purchaseIntent),
        save: jest.fn(),
      } as unknown as PurchaseIntentRepository,
      new InteractionResponseFactory(),
    );

    await expect(service.execute('usr-other', 'pi-1')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

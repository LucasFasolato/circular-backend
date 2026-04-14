import { NotFoundError } from '../../../common/errors/not-found.error';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  function createService() {
    return new ProfilesService(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'usr-1',
          isPhoneVerified: true,
          email: 'martina@example.com',
          phoneE164: '+5493410000000',
          status: 'ACTIVE',
          createdAt: new Date('2026-04-14T12:00:00.000Z'),
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue({
          firstName: 'Martina',
          lastName: null,
          instagramHandle: 'marti.style',
          city: 'Rosario',
          zone: 'Pichincha',
          bio: null,
          avatarUrl: null,
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue({
          hasInstagram: true,
          instagramVerified: false,
          manualReviewRequired: false,
          restrictionFlags: {},
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue([]),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue({
          completedTransactionsCount: 8,
          successfulTransactionsCount: 7,
          failedTransactionsCount: 0,
          cancelledTransactionsCount: 1,
          successRate: '0.8750',
          avgResponseTimeHours: '3.25',
        }),
      } as never,
      {} as never,
    );
  }

  it('returns public profile trust metrics from the persisted reputation profile', async () => {
    const service = createService();

    const result = await service.getPublicProfile('usr-1');

    expect(result.trust.completedTransactions).toBe(8);
    expect(result.trust.successRate).toBe(0.875);
    expect(result.trust.avgResponseTimeHours).toBe(3.25);
    expect(result.trust.cancellations).toBe(1);
  });

  it('fails when the reputation snapshot is missing instead of inventing placeholders', async () => {
    const service = new ProfilesService(
      {
        findById: jest.fn().mockResolvedValue({
          id: 'usr-1',
          isPhoneVerified: true,
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue({
          firstName: 'Martina',
          lastName: null,
          instagramHandle: null,
          city: 'Rosario',
          zone: null,
          bio: null,
          avatarUrl: null,
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue({
          hasInstagram: false,
          instagramVerified: false,
          manualReviewRequired: false,
          restrictionFlags: {},
        }),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue([]),
      } as never,
      {
        findByUserId: jest.fn().mockResolvedValue(null),
      } as never,
      {} as never,
    );

    await expect(service.getPublicProfile('usr-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

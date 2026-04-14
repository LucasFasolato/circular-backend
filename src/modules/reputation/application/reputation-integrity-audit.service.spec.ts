import { ReputationIntegrityAuditService } from './reputation-integrity-audit.service';

describe('ReputationIntegrityAuditService', () => {
  it('returns zero violations when repositories report a clean state', async () => {
    const service = new ReputationIntegrityAuditService(
      {
        countDuplicateTriplets: jest.fn().mockResolvedValue(0),
      } as never,
      {
        countIntegrityViolations: jest.fn().mockResolvedValue({
          invalidSuccessRateProfiles: 0,
          inconsistentCompletedCountProfiles: 0,
          missingReputationProfilesForPublicProfiles: 0,
        }),
      } as never,
    );

    await expect(service.audit()).resolves.toEqual({
      duplicateEntries: 0,
      invalidSuccessRateProfiles: 0,
      inconsistentCompletedCountProfiles: 0,
      missingReputationProfilesForPublicProfiles: 0,
    });
  });
});

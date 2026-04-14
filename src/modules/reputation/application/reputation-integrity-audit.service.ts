import { Injectable } from '@nestjs/common';
import { ReputationEntryRepository } from '../infrastructure/reputation-entry.repository';
import { ReputationProfileSnapshotRepository } from '../infrastructure/reputation-profile-snapshot.repository';

@Injectable()
export class ReputationIntegrityAuditService {
  constructor(
    private readonly reputationEntryRepository: ReputationEntryRepository,
    private readonly reputationProfileSnapshotRepository: ReputationProfileSnapshotRepository,
  ) {}

  async audit() {
    const duplicateEntries =
      await this.reputationEntryRepository.countDuplicateTriplets();
    const profileViolations =
      await this.reputationProfileSnapshotRepository.countIntegrityViolations();

    return {
      duplicateEntries,
      invalidSuccessRateProfiles: profileViolations.invalidSuccessRateProfiles,
      inconsistentCompletedCountProfiles:
        profileViolations.inconsistentCompletedCountProfiles,
      missingReputationProfilesForPublicProfiles:
        profileViolations.missingReputationProfilesForPublicProfiles,
    };
  }
}

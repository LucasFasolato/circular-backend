import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationProfileEntity } from '../profiles/domain/reputation-profile.entity';
import { ReputationEntryEntity } from './domain/reputation-entry.entity';
import { ReputationIntegrityAuditService } from './application/reputation-integrity-audit.service';
import { ReputationRecordingService } from './application/reputation-recording.service';
import { ReputationRecomputeService } from './application/reputation-recompute.service';
import { ReputationEntryRepository } from './infrastructure/reputation-entry.repository';
import { ReputationProfileSnapshotRepository } from './infrastructure/reputation-profile-snapshot.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReputationProfileEntity, ReputationEntryEntity]),
  ],
  providers: [
    ReputationEntryRepository,
    ReputationProfileSnapshotRepository,
    ReputationRecomputeService,
    ReputationRecordingService,
    ReputationIntegrityAuditService,
  ],
  exports: [
    ReputationProfileSnapshotRepository,
    ReputationRecomputeService,
    ReputationRecordingService,
    ReputationIntegrityAuditService,
  ],
})
export class ReputationModule {}

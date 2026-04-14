import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReputationProfileEntity } from '../../profiles/domain/reputation-profile.entity';

@Injectable()
export class ReputationProfileSnapshotRepository {
  constructor(
    @InjectRepository(ReputationProfileEntity)
    private readonly repo: Repository<ReputationProfileEntity>,
  ) {}

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<ReputationProfileEntity | null> {
    const repo = manager
      ? manager.getRepository(ReputationProfileEntity)
      : this.repo;
    return repo.findOne({ where: { userId } });
  }

  async create(
    data: Partial<ReputationProfileEntity>,
    manager?: EntityManager,
  ): Promise<ReputationProfileEntity> {
    const repo = manager
      ? manager.getRepository(ReputationProfileEntity)
      : this.repo;
    return repo.save(repo.create(data));
  }

  async save(
    entity: ReputationProfileEntity,
    manager?: EntityManager,
  ): Promise<ReputationProfileEntity> {
    const repo = manager
      ? manager.getRepository(ReputationProfileEntity)
      : this.repo;
    return repo.save(entity);
  }

  async ensureExists(userId: string, manager?: EntityManager): Promise<void> {
    const existing = await this.findByUserId(userId, manager);

    if (existing) {
      return;
    }

    await this.create(
      {
        userId,
        completedTransactionsCount: 0,
        successfulTransactionsCount: 0,
        failedTransactionsCount: 0,
        cancelledTransactionsCount: 0,
        successRate: '0',
        avgResponseTimeHours: null,
        lastRecomputedAt: null,
      },
      manager,
    );
  }

  async countIntegrityViolations(): Promise<{
    invalidSuccessRateProfiles: number;
    inconsistentCompletedCountProfiles: number;
    missingReputationProfilesForPublicProfiles: number;
  }> {
    const rawUnknown: unknown = await this.repo.query(`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM "reputation_profiles"
          WHERE "success_rate" < 0
            OR "success_rate" > 1
            OR (
              "completed_transactions_count" = 0
              AND "success_rate" <> 0
            )
            OR (
              "completed_transactions_count" > 0
              AND ABS(
                "success_rate"
                - ROUND(
                    "successful_transactions_count"::numeric
                    / NULLIF("completed_transactions_count", 0),
                    4
                  )
              ) > 0.0001
            )
        ) AS invalid_success_rate_profiles,
        (
          SELECT COUNT(*)::int
          FROM "reputation_profiles"
          WHERE "completed_transactions_count" < 0
            OR "successful_transactions_count" < 0
            OR "failed_transactions_count" < 0
            OR "cancelled_transactions_count" < 0
            OR "completed_transactions_count"
              <> "successful_transactions_count"
               + "failed_transactions_count"
               + "cancelled_transactions_count"
        ) AS inconsistent_completed_count_profiles,
        (
          SELECT COUNT(*)::int
          FROM "public_profiles" pp
          LEFT JOIN "reputation_profiles" rp ON rp."user_id" = pp."user_id"
          WHERE rp."id" IS NULL
        ) AS missing_reputation_profiles_for_public_profiles
    `);
    const raw = rawUnknown as Array<{
      invalid_success_rate_profiles: string;
      inconsistent_completed_count_profiles: string;
      missing_reputation_profiles_for_public_profiles: string;
    }>;

    const row = raw[0];

    return {
      invalidSuccessRateProfiles: Number(
        row?.invalid_success_rate_profiles ?? 0,
      ),
      inconsistentCompletedCountProfiles: Number(
        row?.inconsistent_completed_count_profiles ?? 0,
      ),
      missingReputationProfilesForPublicProfiles: Number(
        row?.missing_reputation_profiles_for_public_profiles ?? 0,
      ),
    };
  }
}
